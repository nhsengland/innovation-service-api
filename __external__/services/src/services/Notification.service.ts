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
import { RequestUser } from "@services/models/RequestUser";

import {
  getConnection,
  getRepository,
  In,
  Repository,
  Connection,
} from "typeorm";

export type NotificationDismissResult = {
  success: boolean;
  error?: any;
};

export class NotificationService {
  private readonly notificationRepo: Repository<Notification>;
  private readonly notificationUserRepo: Repository<NotificationUser>;
  private readonly innovationSupportRepo: Repository<InnovationSupport>;
  private readonly innovationRepo: Repository<Innovation>;
  private readonly assessmentRepo: Repository<InnovationAssessment>;
  private readonly organisationUserRepo: Repository<OrganisationUser>;
  private readonly userRepo: Repository<User>;
  private readonly connection: Connection;

  constructor(connectionName?: string) {
    this.connection = getConnection(connectionName);
    this.notificationRepo = getRepository(Notification, connectionName);
    this.notificationUserRepo = getRepository(NotificationUser, connectionName);
    this.innovationSupportRepo = getRepository(
      InnovationSupport,
      connectionName
    );
    this.innovationRepo = getRepository(Innovation, connectionName);
    this.assessmentRepo = getRepository(InnovationAssessment, connectionName);
    this.organisationUserRepo = getRepository(OrganisationUser, connectionName);
    this.userRepo = getRepository(User, connectionName);
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
          message
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
    notifications: Notification[],
    contextType?: NotificationContextType
  ): Promise<NotificationDismissResult> {
    const affected = 0;

    if (notifications && notifications.length > 0) {
      for (let index = 0; index < notifications.length; index++) {
        try {
          const notification = notifications[index];
          const query = this.connection
            .createQueryBuilder()
            .update(NotificationUser)
            .set({ readAt: () => "CURRENT_TIMESTAMP" })
            .where("notification = :notificationId and user = :userId", {
              notificationId: notification.id,
              userId: requestUser.id,
            });

          await query.updateEntity(true).execute();
        } catch (error) {
          return {
            success: false,
            error,
          };
        }
      }
    } else {
      try {
        const query = this.notificationUserRepo
          .createQueryBuilder("notificationUser")
          .select(["notificationUser.user", "notificationUser.notification"])
          .innerJoin("notificationUser.notification", "notification")
          .where(
            "notificationUser.user = :userId and notification.contextType = :contextType",
            {
              userId: requestUser.id,
              contextType,
            }
          );

        const sql = query.getQueryAndParameters();
        const notificationUsers = await query.execute();

        if (notificationUsers.length > 0) {
          await this.notificationUserRepo
            .createQueryBuilder()
            .update()
            .set({ readAt: () => "CURRENT_TIMESTAMP" })
            .where(
              "user IN (:...userIds) and notification IN (:...notifications)",
              {
                userIds: notificationUsers.map((n) => n.user_id),
                notifications: notificationUsers.map((n) => n.notification_id),
              }
            )
            .updateEntity(true)
            .execute();
        }
      } catch (error) {
        return {
          success: false,
          error,
        };
      }
    }

    return {
      success: true,
    };
  }

  private async createNotificationForAccessors(
    requestUser: RequestUser,
    innovationId: string,
    contextType: NotificationContextType,
    contextId: string,
    message: string,
    specificUsers?: string[]
  ) {
    // target users are all accessors whose this innovation has been assigned to and whose support is on ENGAGING status
    // this is obtained from the innovation_support entity

    let targetUsers: { user: string; createdBy: string }[] = [];

    const supports = await this.innovationSupportRepo.find({
      where: {
        innovation: innovationId,
        status: InnovationSupportStatus.ENGAGING,
      },
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
    message: string
  ) {
    // target users are all qualifying accessors who belong to the suggested organisations of an assessment record

    // TODO: For now, QA's only receive notifications intigated when an Innovation finishes the assessment.
    const assessment = await this.assessmentRepo.find({
      where: { innovation: innovationId },
      relations: ["organisations"],
    });

    const organisations = assessment.flatMap((s) =>
      s.organisations.map((x) => x.id)
    );

    const orgUsers = await this.organisationUserRepo.find({
      where: {
        organisation: { id: In(organisations) },
        role: AccessorOrganisationRole.QUALIFYING_ACCESSOR,
      },
      loadRelationIds: true,
    });

    const targetUsers = orgUsers.map((u) => ({
      user: u.user,
      createdBy: requestUser.id,
    }));

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
    message: string
  ) {
    // target user is the owner of the innovation
    // this is obtained from the innovation entity

    const innovation = await this.innovationRepo.findOne(innovationId, {
      loadRelationIds: true,
    });

    const targetUsers = [innovation.owner];

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
    message: string
  ) {
    // target user is the owner of the innovation
    // this is obtained from the innovation entity

    const users = await this.userRepo.find({
      where: {
        type: UserType.ASSESSMENT,
      },
    });

    const targetUsers = users.map((u) => ({
      user: u.id,
      createdBy: requestUser.id,
    }));

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
