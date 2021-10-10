import { NotificationPreference } from "@domain/entity/user/NotificationPreference.entity";
import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import {
  AccessorOrganisationRole,
  Innovation,
  InnovationAssessment,
  InnovationSupport,
  InnovationSupportStatus,
  Notification,
  NotificationAudience,
  NotificationContextType,
  NotificationUser,
  OrganisationUser,
  User,
  UserType,
} from "@domain/index";
import { emailEngines } from "@engines/index";
import { InvalidParamsError } from "@services/errors";
import { checkIfValidUUID } from "@services/helpers";
import { RequestUser } from "@services/models/RequestUser";
import {
  Connection,
  getConnection,
  getRepository,
  In,
  IsNull,
  ObjectLiteral,
  Repository,
} from "typeorm";
import { EmailProps } from "./Email.service";

export type NotificationDismissResult = {
  affected: number;
  updated: ObjectLiteral[];
  error?: any;
};

export type NotificationType = {
  id: string;
  isSubscribed: boolean;
};

export class NotificationService {
  private readonly notificationRepo: Repository<Notification>;
  private readonly notificationUserRepo: Repository<NotificationUser>;
  private readonly notificationPreferenceRepo: Repository<NotificationPreference>;
  private readonly innovationSupportRepo: Repository<InnovationSupport>;
  private readonly innovationRepo: Repository<Innovation>;
  private readonly assessmentRepo: Repository<InnovationAssessment>;
  private readonly organisationUserRepo: Repository<OrganisationUser>;
  private readonly userRepo: Repository<User>;
  private readonly connection: Connection;
  private readonly connectionName: string;

  constructor(connectionName?: string) {
    this.connectionName = connectionName;
    this.connection = getConnection(connectionName);
    this.notificationRepo = getRepository(Notification, connectionName);
    this.notificationUserRepo = getRepository(NotificationUser, connectionName);
    this.notificationPreferenceRepo = getRepository(
      NotificationPreference,
      connectionName
    );
    this.innovationSupportRepo = getRepository(
      InnovationSupport,
      connectionName
    );
    this.innovationRepo = getRepository(Innovation, connectionName);
    this.assessmentRepo = getRepository(InnovationAssessment, connectionName);
    this.organisationUserRepo = getRepository(OrganisationUser, connectionName);
    this.userRepo = getRepository(User, connectionName);
  }

  async sendEmail(
    requestUser: RequestUser,
    templateCode: EmailNotificationTemplate,
    innovationId?: string,
    contextId?: string,
    targetUsers?: string[],
    emailProps?: EmailProps
  ) {
    const handler = emailEngines().find((e) => e.key === templateCode)?.handler;

    if (handler) {
      await handler(
        requestUser,
        {
          innovationId,
          contextId,
          emailProps,
        },
        targetUsers,
        this.connectionName
      );
    }
  }

  async create(
    requestUser: RequestUser,
    audience: NotificationAudience,
    innovationId: string,
    contextType: NotificationContextType,
    contextId: string,
    message: string,
    specificUsers?: string[]
  ): Promise<Notification> {
    let notification: Notification;

    switch (audience) {
      case NotificationAudience.ACCESSORS:
        notification = await this.createNotificationForAccessors(
          requestUser,
          innovationId,
          contextType,
          contextId,
          message,
          specificUsers
        );
        break;
      case NotificationAudience.INNOVATORS:
        notification = await this.createNotificationForInnovators(
          requestUser,
          innovationId,
          contextType,
          contextId,
          message,
          specificUsers || []
        );
        break;
      case NotificationAudience.QUALIFYING_ACCESSORS:
        notification = await this.createNotificationForQualifyingAccessors(
          requestUser,
          innovationId,
          contextType,

          contextId,
          message
        );
        break;
      case NotificationAudience.ASSESSMENT_USERS:
        notification = await this.createNotificationForAssessmentUsers(
          requestUser,
          innovationId,
          contextType,

          contextId,
          message
        );
        break;
      default:
        break;
    }

    return notification;
  }

  async dismiss(
    requestUser: RequestUser,
    contextType: NotificationContextType,
    contextId: string
  ): Promise<NotificationDismissResult> {
    if (!checkIfValidUUID(contextId)) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const notificationUsers = await this.notificationUserRepo.find({
      relations: ["user", "notification"],
      join: {
        alias: "n_users",
        innerJoin: { notification: "n_users.notification" },
      },
      where: (qb) => {
        qb.where({
          user: { id: requestUser.id },
          readAt: IsNull(),
        }).andWhere(
          "notification.contextType = :contextType and notification.context_id = :contextId",
          { contextType, contextId }
        );
      },
      select: ["user", "notification", "readAt"],
    });

    let result;

    try {
      const notificationIds = notificationUsers.map((u) => u.notification.id);

      if (notificationIds.length > 0) {
        result = await this.notificationUserRepo
          .createQueryBuilder()
          .update(NotificationUser)
          .set({ readAt: () => "CURRENT_TIMESTAMP" })
          .where(
            "user = :userId and notification in (:...notificationId) and read_at IS NULL",
            { userId: requestUser.id, notificationId: notificationIds }
          )
          .execute();
      }
    } catch (error) {
      return {
        error,
        updated: [],
        affected: 0,
      };
    }

    return {
      affected: notificationUsers.length,
      updated: notificationUsers,
    };
  }

  async getAllUnreadNotificationsCounts(
    requestUser: RequestUser,
    innovationId?: string
  ): Promise<{ [key: string]: number }> {
    if (innovationId && !checkIfValidUUID(innovationId)) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const query = this.notificationUserRepo
      .createQueryBuilder("n_users")
      .select("notifications.context_type", "contextType")
      .addSelect("COUNT(notifications.context_type)", "count")
      .innerJoin(
        Notification,
        "notifications",
        "n_users.notification_id = notifications.id and read_at IS NULL"
      );

    if (innovationId) {
      query.where("notifications.innovation_id = :innovationId", {
        innovationId: innovationId,
      });
    }

    const unreadNotifications = await query
      .groupBy("notifications.contextType")
      .addGroupBy("n_users.user_id")
      .having("n_users.user_id = :userId ", { userId: requestUser.id })
      .getRawMany();

    return this.convertArrayToObject(unreadNotifications, "contextType");
  }

  async getNotificationsGroupedBySupportStatus(
    requestUser: RequestUser
  ): Promise<{ [key: string]: number }> {
    let innovations = this.innovationRepo
      .createQueryBuilder("innovations")
      .select("supports.status", "status")
      .addSelect("COUNT(1)", "count");

    if (requestUser.type === UserType.ACCESSOR) {
      innovations = innovations.innerJoin(
        InnovationSupport,
        "supports",
        "innovations.id = supports.innovation_id and supports.organisation_unit_id = :orgUnitId",
        {
          orgUnitId: requestUser.organisationUnitUser.organisationUnit.id,
        }
      );
    } else {
      innovations = innovations.innerJoin(
        InnovationSupport,
        "supports",
        "innovations.id = supports.innovation_id "
      );
    }

    innovations = innovations
      .innerJoin(
        Notification,
        "notifications",
        `innovations.id = notifications.innovation_id`
      )
      .innerJoin(
        NotificationUser,
        "notificationUsers",
        "notifications.id = notificationUsers.notification_id and notificationUsers.read_at IS NULL and notificationUsers.user_id = :userId",
        { userId: requestUser.id }
      )
      .groupBy("supports.status");

    const assigned = await innovations.getRawMany();

    let unassigned: { count: number }[] = [];

    if (requestUser.type === UserType.ACCESSOR) {
      const organisationUnit =
        requestUser.organisationUnitUser.organisationUnit;
      const unassignedQuery = this.innovationRepo
        .createQueryBuilder("innovation")
        .select("count(notifications.id)", "count")
        .innerJoin(
          Notification,
          "notifications",
          `innovation.id = notifications.innovation_id and NOT EXISTS(SELECT 1 FROM innovation_support tmp WHERE tmp.innovation_id = innovation.id and deleted_at is null and tmp.organisation_unit_id = :organisationUnitId)`,
          { organisationUnitId: organisationUnit.id }
        )
        .innerJoin(
          NotificationUser,
          "notificationUsers",
          "notifications.id = notificationUsers.notification_id and notificationUsers.user_id = :userId and notificationUsers.read_at IS NULL",
          { userId: requestUser.id }
        )
        .groupBy("innovation.status")
        .having(`innovation.status = :status`, { status: "IN_PROGRESS" });

      unassigned = await unassignedQuery.getRawMany();
    }

    const result = [
      ...assigned,
      ...unassigned.map((u) => ({
        status: InnovationSupportStatus.UNASSIGNED,
        count: u.count,
      })),
    ];

    return this.convertArrayToObject(result, "status");
  }

  async getNotificationsGroupedByInnovationStatus(
    requestUser: RequestUser
  ): Promise<{ [key: string]: number }> {
    const innovations = this.innovationRepo
      .createQueryBuilder("innovations")
      .select("innovations.status", "status")
      .addSelect("COUNT(1)", "count")
      .innerJoin(
        Notification,
        "notifications",
        `innovations.id = notifications.innovation_id`
      )
      .innerJoin(
        NotificationUser,
        "notificationUsers",
        "notifications.id = notificationUsers.notification_id and notificationUsers.read_at IS NULL and notificationUsers.user_id = :userId",
        { userId: requestUser.id }
      )
      .groupBy("innovations.status");

    const assigned = await innovations.getRawMany();

    const result = [...assigned];

    return this.convertArrayToObject(result, "status");
  }

  async getUnreadNotifications(
    requestUser: RequestUser,
    innovationId?: string,
    contextType?: string,
    contextId?: string
  ): Promise<
    {
      id: string;
      contextType: string;
      contextId: string;
      innovationId: string;
      readAt: string;
    }[]
  > {
    if (
      (innovationId && !checkIfValidUUID(innovationId)) ||
      (contextId && !checkIfValidUUID(contextId))
    ) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    let parameters: any = {};
    let filters =
      "n_users.notification_id = notifications.id and read_at IS NULL";

    if (innovationId) {
      filters += " and notifications.innovation_id = :innovationId";
      parameters = {
        ...parameters,
        innovationId,
      };
    }

    if (contextType) {
      filters += " and notifications.context_type = :contextType";
      parameters = {
        ...parameters,
        contextType,
      };
    }

    if (contextId) {
      filters += " and notifications.context_id = :contextId";
      parameters = {
        ...parameters,
        contextId,
      };
    }

    const query = this.notificationUserRepo
      .createQueryBuilder("n_users")
      .select("notifications.id", "id")
      .addSelect("notifications.context_type", "contextType")
      .addSelect("notifications.context_id", "contextId")
      .addSelect("notifications.innovation_id", "innovationId")
      .addSelect("n_users.read_at", "readAt")
      .innerJoin(Notification, "notifications", filters, parameters);

    const unreadNotifications = await query
      .where("n_users.user_id = :userId ", { userId: requestUser.id })
      .getRawMany();

    return unreadNotifications.map((n) => ({
      ...n,
      isRead: n.readAt ? true : false,
    }));
  }

  async getEmailNotificationTypes(
    requestUser: RequestUser
  ): Promise<NotificationType[]> {
    let result: NotificationType[] = [];

    if (requestUser.type === UserType.ACCESSOR) {
      result = [
        { id: NotificationContextType.ACTION, isSubscribed: true },
        { id: NotificationContextType.SUPPORT, isSubscribed: true },
      ];
    } else if (requestUser.type === UserType.INNOVATOR) {
      result = [
        { id: NotificationContextType.ACTION, isSubscribed: true },
        { id: NotificationContextType.SUPPORT, isSubscribed: true },
      ];
    }

    const query = this.notificationPreferenceRepo
      .createQueryBuilder("n_pref")
      .where("n_pref.user_id = :userId", { userId: requestUser.id });

    const notificationTypes = await query.getMany();

    result.forEach((r) => {
      const userPreference = notificationTypes.find(
        (n) => n.notification_id === r.id
      );
      if (userPreference) {
        r.isSubscribed = userPreference.isSubscribed;
      }
    });

    return result;
  }

  private convertArrayToObject = (array, key) => {
    const initialValue = {};
    return array.reduce((obj, item) => {
      return {
        ...obj,
        [item[key]]: item.count,
      };
    }, initialValue);
  };

  private async createNotificationForAccessors(
    requestUser: RequestUser,
    innovationId: string,
    contextType: NotificationContextType,
    contextId: string,
    message: string,
    specificUsers?: string[]
  ) {
    // target users are all accessors whose this innovation has been assigned to and whose support is on ENGAGING status OR COMPLETE status
    // this is obtained from the innovation_support entity

    let targetUsers: { user: string; createdBy: string }[] = [];

    const supports = await this.innovationSupportRepo.find({
      where: `innovation_id = '${innovationId}' and status in('${InnovationSupportStatus.ENGAGING}', '${InnovationSupportStatus.COMPLETE}')`,
      relations: [
        "organisationUnitUsers",
        "organisationUnitUsers.organisationUser",
        "organisationUnitUsers.organisationUser.user",
      ],
    });

    if (!specificUsers || specificUsers.length === 0) {
      targetUsers = supports.flatMap((s) =>
        s.organisationUnitUsers.map((x) => ({
          user: x.organisationUser.user.id,
          createdBy: requestUser.id,
        }))
      );
    } else {
      targetUsers = specificUsers?.map((u) => ({
        user: u,
        createdBy: requestUser.id,
      }));
    }

    targetUsers = targetUsers.filter((u) => u.user !== requestUser.id);
    const notification = Notification.new({
      contextId,
      contextType,

      innovation: innovationId,
      notificationUsers: targetUsers,
      message,
      createdBy: requestUser.id,
    });

    return await this.notificationRepo.save(notification);
  }

  private async createNotificationForQualifyingAccessors(
    requestUser: RequestUser,
    innovationId: string,
    contextType: NotificationContextType,
    contextId: string,
    message: string,
    specificUsers?: string[]
  ) {
    let targetUsers: any[] = [];
    // target users are all qualifying accessors who belong to the suggested organisations of an assessment record

    // TODO: For now, QA's only receive notifications intigated when an Innovation finishes the assessment.
    const assessment = await this.assessmentRepo.find({
      where: { innovation: innovationId },
      relations: ["organisationUnits", "organisationUnits.organisation"],
    });

    const organisations = assessment.flatMap((s) =>
      s.organisationUnits.map((x) => x.organisation.id)
    );

    const orgUsers = await this.organisationUserRepo.find({
      where: {
        organisation: { id: In(organisations) },
        role: AccessorOrganisationRole.QUALIFYING_ACCESSOR,
      },
      loadRelationIds: true,
    });

    if (!specificUsers || specificUsers.length === 0) {
      targetUsers = orgUsers.map((u) => ({
        user: u.user,
        createdBy: requestUser.id,
      }));
    } else {
      targetUsers = specificUsers?.map((u) => ({
        user: u,
        createdBy: requestUser.id,
      }));
    }

    targetUsers = targetUsers.filter((u) => u.user !== requestUser.id);

    const notification = Notification.new({
      contextId,
      contextType,

      innovation: innovationId,
      notificationUsers: targetUsers,
      message,
      createdBy: requestUser.id,
    });

    return await this.notificationRepo.save(notification);
  }

  private async createNotificationForInnovators(
    requestUser: RequestUser,
    innovationId: string,
    contextType: NotificationContextType,
    contextId: string,
    message: string,
    specificUsers: string[]
  ) {
    // target user is the owner of the innovation
    // this is obtained from the innovation entity

    const innovation = await this.innovationRepo.findOne(innovationId, {
      loadRelationIds: true,
    });

    specificUsers = specificUsers.filter((u) => u !== requestUser.id);
    const targetUsers = [innovation.owner, ...specificUsers];

    const notification = Notification.new({
      contextId,
      contextType,

      innovation: innovationId,
      notificationUsers: targetUsers.map((u) => ({
        user: u,
        createdBy: requestUser.id,
      })),
      message,
      createdBy: requestUser.id,
    });

    return await this.notificationRepo.save(notification);
  }

  private async createNotificationForAssessmentUsers(
    requestUser: RequestUser,
    innovationId: string,
    contextType: NotificationContextType,
    contextId: string,
    message: string,
    specificUsers?: string[]
  ) {
    let targetUsers: any[] = [];
    // target user is the owner of the innovation
    // this is obtained from the innovation entity

    const users = await this.userRepo.find({
      where: {
        type: UserType.ASSESSMENT,
      },
    });

    if (!specificUsers || specificUsers.length === 0) {
      targetUsers = users.map((u) => ({
        user: u.id,
        createdBy: requestUser.id,
      }));
    } else {
      targetUsers = specificUsers?.map((u) => ({
        user: u,
        createdBy: requestUser.id,
      }));
    }

    targetUsers = targetUsers.filter((u) => u.user !== requestUser.id);

    const notification = Notification.new({
      contextId,
      contextType,

      innovation: innovationId,
      notificationUsers: targetUsers,
      message,
      createdBy: requestUser.id,
    });

    return await this.notificationRepo.save(notification);
  }
}
