import {
  AccessorOrganisationRole,
  Innovation,
  InnovationAssessment,
  InnovationSupport,
  InnovationSupportStatus,
  Notification,
  NotificationAudience,
  NotificationContextType,
  OrganisationUser,
  User,
  UserType,
} from "@domain/index";
import { RequestUser } from "@services/models/RequestUser";
import { getConnection, getRepository, In, Repository } from "typeorm";

export class NotificationService {
  private readonly notificationRepo: Repository<Notification>;
  private readonly innovationSupportRepo: Repository<InnovationSupport>;
  private readonly innovationRepo: Repository<Innovation>;
  private readonly assessmentRepo: Repository<InnovationAssessment>;
  private readonly organisationUserRepo: Repository<OrganisationUser>;
  private readonly userRepo: Repository<User>;

  constructor(connectionName?: string) {
    getConnection(connectionName);
    this.notificationRepo = getRepository(Notification, connectionName);
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
    message: string
  ): Promise<Notification> {
    let notification: Notification;
    switch (audience) {
      case NotificationAudience.ACCESSORS:
        notification = await this.createNotificationForAccessors(
          requestUser,
          innovationId,
          contextType,
          contextId,
          message
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

  private async createNotificationForAccessors(
    requestUser: RequestUser,
    innovationId: string,
    contextType: NotificationContextType,
    contextId: string,
    message: string
  ) {
    // target users are all accessors whose this innovation has been assigned to and whose support is on ENGAGING status
    // this is obtained from the innovation_support entity

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

    const targetUsers = supports.flatMap((s) =>
      s.organisationUnitUsers.map((x) => ({
        user: x.organisationUser.user.id,
        createdBy: requestUser.id,
      }))
    );

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
    });

    return await this.notificationRepo.save(notification);
  }
}
