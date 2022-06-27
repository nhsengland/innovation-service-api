import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import {
  NotifContextDetail,
  NotifContextType,
} from "@domain/enums/notification.enums";
import {
  AccessorOrganisationRole,
  Innovation,
  InnovationAssessment,
  InnovationSupport,
  InnovationSupportStatus,
  Notification,
  NotificationAudience,
  NotificationContextType,
  NotificationPreference,
  NotificationUser,
  OrganisationUser,
  User,
  UserType,
} from "@domain/index";
import { emailEngines } from "@engines/index";
import { InvalidParamsError } from "@services/errors";
import { checkIfValidUUID } from "@services/helpers";
import { PreferenceUpdateModel } from "@services/models/PreferenceUpdateModel";
import { PreferenceUpdateResult } from "@services/models/PreferenceUpdateResult";
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
        templateCode,
        targetUsers,
        this.connectionName
      );
    }
  }

  async create(
    requestUser: RequestUser,
    audience: NotificationAudience,
    innovationId: string,
    contextType: NotifContextType,
    contextDetail: NotifContextDetail,
    contextId: string,
    params?: { [key: string]: any },
    specificUsers?: string[]
  ): Promise<Notification> {
    let notification: Notification;

    switch (audience) {
      case NotificationAudience.ACCESSORS:
        notification = await this.createNotificationForAccessors(
          requestUser,
          innovationId,
          contextType,
          contextDetail,
          contextId,
          params,
          specificUsers
        );
        break;
      case NotificationAudience.INNOVATORS:
        notification = await this.createNotificationForInnovators(
          requestUser,
          innovationId,
          contextType,
          contextDetail,
          contextId,
          specificUsers || [],
          params
        );
        break;
      case NotificationAudience.QUALIFYING_ACCESSORS:
        notification = await this.createNotificationForQualifyingAccessors(
          requestUser,
          innovationId,
          contextType,
          contextDetail,
          contextId,
          params
        );
        break;
      case NotificationAudience.ASSESSMENT_USERS:
        notification = await this.createNotificationForAssessmentUsers(
          requestUser,
          innovationId,
          contextType,
          contextDetail,
          contextId,
          params
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

  async getEmailNotificationPreferences(
    requestUser: RequestUser
  ): Promise<NotificationType[]> {
    const result = [
      { id: NotificationContextType.ACTION, isSubscribed: true },
      { id: NotificationContextType.SUPPORT, isSubscribed: true },
      { id: NotificationContextType.COMMENT, isSubscribed: true },
    ];

    // if the user type has a specific notification
    // then extend the result array with those rules

    const query = this.notificationPreferenceRepo
      .createQueryBuilder("n_pref")
      .where("n_pref.user_id = :userId", { userId: requestUser.id });

    const notificationPreferences = await query.getMany();

    result.forEach((r) => {
      const userPreference = notificationPreferences.find(
        (n) => n.notification_id === r.id
      );
      if (userPreference) {
        r.isSubscribed = userPreference.isSubscribed;
      }
    });

    return result;
  }

  async updateEmailNotificationPreferences(
    requestUser: RequestUser,
    preferences: PreferenceUpdateModel[]
  ): Promise<PreferenceUpdateResult[]> {
    if (!requestUser || !preferences || preferences.length === 0) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const results: PreferenceUpdateResult[] = [];

    for (let i = 0; i < preferences.length; i++) {
      const preference = preferences[i];
      let result: PreferenceUpdateResult;

      try {
        result = await this.updatePreference(requestUser, preferences[i]);
      } catch (err) {
        result = {
          id: preference.notificationType,
          status: "ERROR",
          error: {
            code: err.constructor.name,
            message: err.message,
          },
        };
      }

      results.push(result);
    }

    return results;
  }

  private async updatePreference(
    requestUser: RequestUser,
    preferenceModel: PreferenceUpdateModel
  ): Promise<PreferenceUpdateResult> {
    if (!requestUser || !preferenceModel) {
      throw new InvalidParamsError("Invalid params.");
    }

    const user_id = requestUser.id;

    const query = this.notificationPreferenceRepo
      .createQueryBuilder("n_pref")
      .select("users.id", "user_id")
      .innerJoin(User, "users", "n_pref.user_id = users.id")
      .where(
        "n_pref.notification_id = :notificationId and users.id = :userId",
        { notificationId: preferenceModel.notificationType, userId: user_id }
      );

    let userNotificationPreference = await query.getOne();

    if (userNotificationPreference) {
      userNotificationPreference.isSubscribed = preferenceModel.isSubscribed;
    } else {
      userNotificationPreference = NotificationPreference.new({
        notification_id: preferenceModel.notificationType,
        isSubscribed: preferenceModel.isSubscribed,
        user: { id: user_id },
      });
    }

    const result = await this.notificationPreferenceRepo.save(
      userNotificationPreference
    );

    return {
      id: result.notification_id,
      status: "OK",
    };
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
    contextType: NotifContextType,
    contextDetail: NotifContextDetail,
    contextId: string,
    params?: { [key: string]: any },
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
      contextDetail,

      innovation: innovationId,
      params,
      notificationUsers: targetUsers,
      createdBy: requestUser.id,
    });

    return await this.notificationRepo.save(notification);
  }

  private async createNotificationForQualifyingAccessors(
    requestUser: RequestUser,
    innovationId: string,
    contextType: NotifContextType,
    contextDetail: NotifContextDetail,
    contextId: string,
    params?: { [key: string]: any },
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
      contextDetail,
      innovation: innovationId,
      notificationUsers: targetUsers,
      params,
      createdBy: requestUser.id,
    });

    return await this.notificationRepo.save(notification);
  }

  private async createNotificationForInnovators(
    requestUser: RequestUser,
    innovationId: string,
    contextType: NotifContextType,
    contextDetail: NotifContextDetail,
    contextId: string,
    specificUsers: string[],
    params?: { [key: string]: any }
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
      contextDetail,
      innovation: innovationId,
      notificationUsers: targetUsers.map((u) => ({
        user: u,
        createdBy: requestUser.id,
      })),
      params,
      createdBy: requestUser.id,
    });

    return await this.notificationRepo.save(notification);
  }

  private async createNotificationForAssessmentUsers(
    requestUser: RequestUser,
    innovationId: string,
    contextType: NotifContextType,
    contextDetail: NotifContextDetail,
    contextId: string,
    params?: { [key: string]: any },
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
      contextDetail,
      innovation: innovationId,
      notificationUsers: targetUsers,
      params,
      createdBy: requestUser.id,
    });

    return await this.notificationRepo.save(notification);
  }
}
