import {
  AccessorOrganisationRole,
  Innovation,
  InnovationAssessment,
  InnovationStatus,
  InnovationSupport,
  InnovationSupportStatus,
  Notification,
  NotificationAudience,
  NotificationContextType,
  OrganisationUnit,
} from "@domain/index";
import { getConnection, getRepository, In, Repository } from "typeorm";

export class NotificationService {
  private readonly notificationRepo: Repository<Notification>;
  private readonly innovationSupportRepo: Repository<InnovationSupport>;
  private readonly innovationRepo: Repository<Innovation>;
  private readonly assessmentRepo: Repository<InnovationAssessment>;
  private readonly organisationUnitsRepo: Repository<OrganisationUnit>;

  constructor(connectionName?: string) {
    getConnection(connectionName);
    this.notificationRepo = getRepository(Notification, connectionName);
    this.innovationSupportRepo = getRepository(
      InnovationSupport,
      connectionName
    );
    this.innovationRepo = getRepository(Innovation, connectionName);
    this.assessmentRepo = getRepository(InnovationAssessment, connectionName);
    this.organisationUnitsRepo = getRepository(
      OrganisationUnit,
      connectionName
    );
  }

  async create(
    audience: NotificationAudience,
    innovationId: string,
    contextType: NotificationContextType,
    message: string
  ): Promise<Notification> {
    let notification: Notification;
    switch (audience) {
      case NotificationAudience.ACCESSORS:
        notification = await this.createNotificationForAccessors(
          innovationId,
          contextType,
          message
        );
        break;
      case NotificationAudience.INNOVATORS:
        notification = await this.createNotificationForInnovators(
          innovationId,
          contextType,
          message
        );
        break;
      case NotificationAudience.QUALIFYING_ACCESSORS:
        notification = await this.createNotificationForQualifyingAccessors(
          innovationId,
          contextType,
          message
        );
        break;
      case NotificationAudience.ASSESSMENT_USERS:
        break;
      default:
        break;
    }

    return notification;
  }

  private async createNotificationForAccessors(
    innovationId: string,
    contextType: NotificationContextType,
    message: string
  ) {
    // target users are all accessors whose this innovation has been assigned to and whose support is on ENGAGING status
    // this is obtained from the innovation_support entity

    const supports = await this.innovationSupportRepo.find({
      where: {
        innovation: innovationId,
        status: InnovationSupportStatus.ENGAGING,
      },
      relations: ["organisationUnitUsers"],
    });

    const targetUsers = supports.flatMap((s) =>
      s.organisationUnitUsers.map((x) => x.organisationUser.id)
    );

    const notification = Notification.new({
      contextId: innovationId,
      contextType,
      innovation: innovationId,
      notificationUsers: targetUsers,
      message,
    });

    return await this.notificationRepo.save(notification);
  }

  private async createNotificationForQualifyingAccessors(
    innovationId: string,
    contextType: NotificationContextType,
    message: string
  ) {
    // target users are all qualifying accessors who belong to the suggested organisations of an assessment record

    const assessment = await this.assessmentRepo.find({
      where: { innovation: innovationId },
      relations: ["organisations"],
    });

    const organisations = assessment.flatMap((s) =>
      s.organisations.map((x) => x.id)
    );

    const units = await this.organisationUnitsRepo.find({
      where: { organisation: In(organisations) },
    });

    const targetUsers = units.flatMap((u) =>
      u.organisationUnitUsers
        .filter(
          (user) =>
            user.organisationUser.role ===
            AccessorOrganisationRole.QUALIFYING_ACCESSOR
        )
        .map((user) => user.id)
    );

    const notification = Notification.new({
      contextId: innovationId,
      contextType,
      innovation: innovationId,
      notificationUsers: targetUsers,
      message,
    });

    return await this.notificationRepo.save(notification);
  }

  private async createNotificationForInnovators(
    innovationId: string,
    contextType: NotificationContextType,
    message: string
  ) {
    // target user is the owner of the innovation
    // this is obtained from the innovation entity

    const innovation = await this.innovationRepo.findOne(innovationId, {
      relations: ["owner"],
    });

    const targetUsers = [innovation.owner.id];

    const notification = Notification.new({
      contextId: innovationId,
      contextType,
      innovation: innovationId,
      notificationUsers: targetUsers,
      message,
    });

    return await this.notificationRepo.save(notification);
  }
}
