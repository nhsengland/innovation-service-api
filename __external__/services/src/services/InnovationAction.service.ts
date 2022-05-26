import { Activity } from "@domain/enums/activity.enums";
import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import {
  AccessorOrganisationRole,
  Comment,
  InnovationAction,
  InnovationActionStatus,
  InnovationSectionAliasCatalogue,
  InnovationSupport,
  NotificationAudience,
  NotificationContextType,
  UserType,
} from "@domain/index";
import {
  InnovationNotFoundError,
  InnovationSupportNotFoundError,
  InvalidDataError,
  InvalidParamsError,
  InvalidUserRoleError,
  MissingUserOrganisationError,
  MissingUserOrganisationUnitError,
  ResourceNotFoundError,
} from "@services/errors";
import { checkIfValidUUID, hasAccessorRole } from "@services/helpers";
import { InnovationActionModel } from "@services/models/InnovationActionModel";
import { RequestUser } from "@services/models/RequestUser";
import {
  Connection,
  FindManyOptions,
  getConnection,
  getRepository,
  Repository,
} from "typeorm";
import { ActivityLogService } from "./ActivityLog.service";
import { InnovationService } from "./Innovation.service";
import { InnovationSectionService } from "./InnovationSection.service";
import { LoggerService } from "./Logger.service";
import { NotificationService } from "./Notification.service";
import { UserService } from "./User.service";

export class InnovationActionService {
  private readonly connection: Connection;
  private readonly actionRepo: Repository<InnovationAction>;
  private readonly innovationService: InnovationService;
  private readonly innovationSectionService: InnovationSectionService;
  private readonly userService: UserService;
  private readonly notificationService: NotificationService;
  private readonly logService: LoggerService;
  private readonly activityLogService: ActivityLogService;

  constructor(connectionName?: string) {
    this.connection = getConnection(connectionName);
    this.actionRepo = getRepository(InnovationAction, connectionName);
    this.innovationService = new InnovationService(connectionName);
    this.innovationSectionService = new InnovationSectionService(
      connectionName
    );
    this.userService = new UserService(connectionName);
    this.notificationService = new NotificationService(connectionName);
    this.logService = new LoggerService();
    this.activityLogService = new ActivityLogService(connectionName);
  }

  async create(requestUser: RequestUser, innovationId: string, action: any) {
    if (!requestUser || !action || !innovationId) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    if (!requestUser.organisationUser) {
      throw new MissingUserOrganisationError(
        "Invalid user. User has no organisations."
      );
    }

    if (!requestUser.organisationUnitUser) {
      throw new MissingUserOrganisationUnitError(
        "Invalid user. User has no organisation units."
      );
    }

    const filterOptions = {
      relations: [
        "sections",
        "innovationSupports",
        "innovationSupports.organisationUnit",
      ],
    };
    const innovation = await this.innovationService.findInnovation(
      requestUser,
      innovationId,
      filterOptions
    );
    if (!innovation) {
      throw new InnovationNotFoundError(
        "Invalid parameters. Innovation not found for the user."
      );
    }

    const sections = await innovation.sections;
    let actionsCounter = 0;

    let innovationSection = sections.find(
      (sec) => sec.section === action.section
    );
    if (!innovationSection) {
      innovationSection = await this.innovationSectionService.createSection(
        requestUser,
        innovation.id,
        action.section
      );
    } else {
      const actions = await innovationSection.actions;
      actionsCounter = actions.length;
    }

    const organisationUnit = requestUser.organisationUnitUser.organisationUnit;

    const innovationSupport: InnovationSupport = innovation?.innovationSupports.find(
      (is: InnovationSupport) => is.organisationUnit.id === organisationUnit.id
    );
    if (!innovationSupport) {
      throw new InnovationSupportNotFoundError(
        "Invalid parameters. Innovation Support not found."
      );
    }

    const actionObj = {
      displayId: this.getActionDisplayId(action.section, actionsCounter),
      description: action.description,
      status: InnovationActionStatus.REQUESTED,
      innovationSection: { id: innovationSection.id },
      innovationSupport: { id: innovationSupport.id },
      createdBy: requestUser.id,
      updatedBy: requestUser.id,
    };

    //const result = await this.actionRepo.save(actionObj);
    const result = await this.connection.transaction(async (trs) => {
      const actionResult = await trs.save(InnovationAction, actionObj);
      try {
        await this.activityLogService.createLog(
          requestUser,
          innovation,
          Activity.ACTION_CREATION,
          trs,
          {
            sectionId: action.section,
            actionId: actionResult.id,
            commentValue: actionResult.description,
          }
        );
      } catch (error) {
        this.logService.error(
          `An error has occured while creating activity log from ${requestUser.id}`,
          error
        );
        throw error;
      }

      return actionResult;
    });

    try {
      await this.notificationService.create(
        requestUser,
        NotificationAudience.INNOVATORS,
        innovation.id,
        NotificationContextType.ACTION,

        result.id,
        `An action was created by the accessor with id ${requestUser.id} for the innovation ${innovation.name}(${innovationId})`
      );
    } catch (error) {
      this.logService.error(
        `An error has occured while creating a notification of type ${NotificationContextType.INNOVATION} from ${requestUser.id}`,
        error
      );
    }

    try {
      await this.notificationService.sendEmail(
        requestUser,
        EmailNotificationTemplate.INNOVATORS_ACTION_REQUEST,
        innovationId,
        result.id
      );
    } catch (error) {
      this.logService.error(
        `An error has occured an email with the template ${EmailNotificationTemplate.INNOVATORS_ACTION_REQUEST} from ${requestUser.id}`,
        error
      );
    }

    return result;
  }

  async updateByAccessor(
    requestUser: RequestUser,
    id: string,
    innovationId: string,
    action: any
  ) {
    if (!id || !requestUser || !action) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    if (!requestUser.organisationUser) {
      throw new MissingUserOrganisationError(
        "Invalid user. User has no organisations."
      );
    }

    if (!requestUser.organisationUnitUser) {
      throw new MissingUserOrganisationUnitError(
        "Invalid user. User has no organisation units."
      );
    }

    const organisationUnit = requestUser.organisationUnitUser.organisationUnit;

    const innovation = await this.innovationService.findInnovation(
      requestUser,
      innovationId,
      null
    );
    if (!innovation) {
      throw new InvalidParamsError(
        "Invalid parameters. Innovation not found for the user."
      );
    }

    const innovationAction = await this.findOne(id);
    if (
      !innovationAction ||
      innovationAction.innovationSupport.organisationUnit.id !==
        organisationUnit.id
    ) {
      throw new InvalidDataError("Invalid action data.");
    }

    const result = await this.update(
      requestUser,
      innovationAction,
      innovationId,
      action
    );

    try {
      await this.notificationService.create(
        requestUser,
        NotificationAudience.INNOVATORS,
        innovationId,
        NotificationContextType.ACTION,
        result.id,
        `An action was updated by the accessor with id ${requestUser.id} for the innovation ${innovation.name}(${innovationId})`
      );
    } catch (error) {
      this.logService.error(
        `An error has occured while creating a notification of type ${NotificationContextType.ACTION} from ${requestUser.id}`,
        error
      );
    }

    return result;
  }

  async updateByInnovator(
    requestUser: RequestUser,
    id: string,
    innovationId: string,
    action: any
  ) {
    if (!requestUser || !id || !action) {
      throw new InvalidParamsError("Invalid parameters.");
    }
    let targetNotificationUsers: string[] = [];
    const filterOptions = {
      relations: ["innovationSection", "innovationSection.innovation"],
      where: `owner_id = '${requestUser.id}'`,
    };

    const innovationAction = await this.actionRepo.findOne(id, filterOptions);
    if (!innovationAction) {
      throw new ResourceNotFoundError("Invalid parameters.");
    }

    const result = await this.update(
      requestUser,
      innovationAction,
      innovationId,
      action
    );
    targetNotificationUsers = [innovationAction.createdBy];
    try {
      await this.notificationService.create(
        requestUser,
        NotificationAudience.ACCESSORS,
        innovationId,
        NotificationContextType.ACTION,
        innovationAction.id,
        `An action was updated by the innovator with id ${requestUser.id} for the innovation with id ${innovationId}`,
        targetNotificationUsers
      );
    } catch (error) {
      this.logService.error(
        `An error has occured while creating a notification of type ${NotificationContextType.ACTION} from ${requestUser.id}`,
        error
      );
    }

    return result;
  }

  async find(
    requestUser: RequestUser,
    id: string,
    innovationId: string
  ): Promise<InnovationActionModel> {
    if (
      !requestUser ||
      !innovationId ||
      !checkIfValidUUID(id) ||
      !checkIfValidUUID(innovationId)
    ) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const innovation = await this.innovationService.findInnovation(
      requestUser,
      innovationId,
      null
    );
    if (!innovation) {
      throw new InnovationNotFoundError(
        "Invalid parameters. Innovation not found for the user."
      );
    }

    const innovationAction = await this.findOne(id);
    if (!innovationAction) {
      throw new ResourceNotFoundError(
        "Invalid parameters. Innovation action not found."
      );
    }

    const b2cCreatorUser = await this.userService.getProfile(
      innovationAction.createdBy,
      requestUser.externalId
    );
    const organisationUnit =
      innovationAction.innovationSupport.organisationUnit;

    return {
      id: innovationAction.id,
      displayId: innovationAction.displayId,
      status: innovationAction.status,
      description: innovationAction.description,
      section: innovationAction.innovationSection.section,
      createdAt: innovationAction.createdAt,
      updatedAt: innovationAction.updatedAt,
      createdBy: {
        id: innovationAction.createdBy,
        name: b2cCreatorUser.displayName,
        organisationName: organisationUnit.organisation.name,
        organisationUnitName: organisationUnit.name,
      },
    };
  }

  async findAllByAccessor(
    requestUser: RequestUser,
    openActions: boolean,
    skip: number,
    take: number,
    order?: { [key: string]: "ASC" | "DESC" }
  ) {
    if (!requestUser) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    if (!requestUser.organisationUser) {
      throw new MissingUserOrganisationError(
        "Invalid user. User has no organisations."
      );
    }

    const organisationUser = requestUser.organisationUser;

    if (!hasAccessorRole(organisationUser.role)) {
      throw new InvalidUserRoleError("Invalid user. User has an invalid role.");
    }

    const query = this.actionRepo
      .createQueryBuilder("innovationAction")
      .innerJoinAndSelect(
        "innovationAction.innovationSection",
        "innovationSection"
      )
      .innerJoinAndSelect("innovationSection.innovation", "innovation")
      .where(
        "InnovationAction.status IN (:...statuses) and InnovationAction.created_by = :created_by",
        {
          statuses: this.getFilterStatusList(openActions),
          created_by: requestUser.id,
        }
      )
      .take(take)
      .skip(skip);

    if (order) {
      order["displayId"] &&
        query.orderBy("innovationAction.displayId", order["displayId"]);
      order["section"] &&
        query.orderBy("innovationSection.section", order["section"]);
      order["innovationName"] &&
        query.orderBy("innovation.name", order["innovationName"]);
      order["createdAt"] &&
        query.orderBy("innovationAction.createdAt", order["createdAt"]);
      order["status"] &&
        query.orderBy("innovationAction.status", order["status"]);
    } else {
      query.orderBy("innovationAction.createdAt", "DESC");
    }

    if (
      organisationUser.role === AccessorOrganisationRole.QUALIFYING_ACCESSOR
    ) {
      query
        .innerJoinAndSelect(
          "innovation.organisationShares",
          "organisationShares"
        )
        .andWhere("organisation_id = :organisationId", {
          organisationId: organisationUser.organisation.id,
        });
    } else {
      const organisationUnit =
        requestUser.organisationUnitUser.organisationUnit;

      query
        .innerJoinAndSelect(
          "innovation.innovationSupports",
          "innovationSupports"
        )
        .andWhere("organisation_unit_id = :organisationUnitId", {
          organisationUnitId: organisationUnit.id,
        });
    }

    const [innovationActions, count] = await query.getManyAndCount();

    const notifications = await this.notificationService.getUnreadNotifications(
      requestUser,
      null,
      NotificationContextType.ACTION
    );

    const actions = innovationActions?.map((ia: InnovationAction) => {
      const unread = notifications.filter((n) => n.contextId === ia.id);

      return {
        id: ia.id,
        displayId: ia.displayId,
        innovation: {
          id: ia.innovationSection.innovation.id,
          name: ia.innovationSection.innovation.name,
        },
        status: ia.status,
        section: ia.innovationSection.section,
        createdAt: ia.createdAt,
        updatedAt: ia.updatedAt,
        notifications: {
          count: unread?.length || 0,
        },
      };
    });

    return {
      data: actions,
      count: count,
    };
  }

  async findAllByInnovation(
    requestUser: RequestUser,
    innovationId: string
  ): Promise<InnovationActionModel[]> {
    if (!requestUser || !innovationId || !checkIfValidUUID(innovationId)) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const innovation = await this.innovationService.findInnovation(
      requestUser,
      innovationId
    );
    if (!innovation) {
      throw new InnovationNotFoundError(
        "Invalid parameters. Innovation not found for the user."
      );
    }

    const filterOptions: FindManyOptions<InnovationAction> = {
      relations: ["innovationSection"],
      where: `innovation_id = '${innovation.id}'`,
    };
    const innovationActions = await this.actionRepo.find(filterOptions);

    const notifications = await this.notificationService.getUnreadNotifications(
      requestUser,
      innovationId,
      NotificationContextType.ACTION
    );

    return innovationActions.map((ia: InnovationAction) => {
      const unread = notifications.filter((n) => n.contextId === ia.id);
      return {
        id: ia.id,
        displayId: ia.displayId,
        status: ia.status,
        description: ia.description,
        section: ia.innovationSection.section,
        createdAt: ia.createdAt,
        updatedAt: ia.updatedAt,
        notifications: {
          count: unread?.length || 0,
          data: unread,
        },
      };
    });
  }

  private async update(
    requestUser: RequestUser,
    innovationAction: InnovationAction,
    innovationId: string,
    action: any
  ) {
    const innovation = await this.innovationService.find(innovationId);
    if (!innovation) {
      throw new InnovationNotFoundError(
        `The Innovation with id ${innovationId} was not found.`
      );
    }
    return await this.connection.transaction(async (transactionManager) => {
      let comment;
      if (action.comment) {
        comment = Comment.new({
          user: { id: requestUser.id },
          innovation: { id: innovationId },
          message: action.comment,
          innovationAction: { id: innovationAction.id },
          createdBy: requestUser.id,
          updatedBy: requestUser.id,
          organisationUnit: requestUser.organisationUnitUser
            ? { id: requestUser.organisationUnitUser.organisationUnit.id }
            : null,
        });
        await transactionManager.save(Comment, comment);
      }

      innovationAction.status = action.status;
      innovationAction.updatedBy = requestUser.id;

      if (action.status === InnovationActionStatus.DECLINED) {
        try {
          const actionCreatedBy = await this.userService.getUser(
            innovationAction.createdBy
          );
          await this.activityLogService.createLog(
            requestUser,
            innovation,
            Activity.ACTION_STATUS_DECLINED_UPDATE,
            transactionManager,
            {
              actionId: innovationAction.id,
              interveningUserId: actionCreatedBy.externalId,
              commentId: comment?.id,
              commentValue: comment?.message,
            }
          );
        } catch (error) {
          this.logService.error(
            `An error has occured while creating activity log from ${requestUser.id}`,
            error
          );
          throw error;
        }
      } else {
        if (action.status === InnovationActionStatus.COMPLETED) {
          try {
            await this.activityLogService.createLog(
              requestUser,
              innovation,
              Activity.ACTION_STATUS_COMPLETED_UPDATE,
              transactionManager,
              {
                actionId: innovationAction.id,
                commentId: comment?.id,
                commentValue: comment?.message,
              }
            );
          } catch (error) {
            this.logService.error(
              `An error has occured while creating activity log from ${requestUser.id}`,
              error
            );
            throw error;
          }
        }
      }

      return await transactionManager.save(InnovationAction, innovationAction);
    });
  }

  private async findOne(id: string): Promise<InnovationAction> {
    const filterOptions = {
      relations: [
        "innovationSection",
        "innovationSupport",
        "innovationSupport.organisationUnit",
        "innovationSupport.organisationUnit.organisation",
      ],
    };

    return await this.actionRepo.findOne(id, filterOptions);
  }

  private getActionDisplayId(section: string, counter: number) {
    const alias = InnovationSectionAliasCatalogue[section] || "ZZ";
    return alias + (++counter).toString().slice(-2).padStart(2, "0");
  }

  private getFilterStatusList(openActions: boolean) {
    if (openActions) {
      return [
        InnovationActionStatus.IN_REVIEW,
        InnovationActionStatus.REQUESTED,
        InnovationActionStatus.CONTINUE,
        InnovationActionStatus.STARTED,
      ];
    } else {
      return [
        InnovationActionStatus.COMPLETED,
        InnovationActionStatus.DECLINED,
        InnovationActionStatus.DELETED,
        InnovationActionStatus.CANCELLED,
      ];
    }
  }

  async findAllByAccessorAdvanced(
    requestUser: RequestUser,
    innovationStatus: string[],
    innovationSection: string[],
    name: string,
    skip: number,
    take: number,
    order?: { [key: string]: "ASC" | "DESC" }
  ) {
    if (!requestUser) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    if (!requestUser.organisationUser) {
      throw new MissingUserOrganisationError(
        "Invalid user. User has no organisations."
      );
    }

    const organisationUser = requestUser.organisationUser;

    if (!hasAccessorRole(organisationUser.role)) {
      throw new InvalidUserRoleError("Invalid user. User has an invalid role.");
    }

    const query = this.actionRepo
      .createQueryBuilder("innovationAction")
      .innerJoinAndSelect(
        "innovationAction.innovationSection",
        "innovationSection"
      )
      .innerJoinAndSelect("innovationSection.innovation", "innovation")
      .where("InnovationAction.created_by = :created_by", {
        created_by: requestUser.id,
      });

    if (
      organisationUser.role === AccessorOrganisationRole.QUALIFYING_ACCESSOR
    ) {
      query
        .innerJoinAndSelect(
          "innovation.organisationShares",
          "organisationShares"
        )
        .andWhere("organisation_id = :organisationId", {
          organisationId: organisationUser.organisation.id,
        });
    } else {
      const organisationUnit =
        requestUser.organisationUnitUser.organisationUnit;

      query
        .innerJoinAndSelect(
          "innovation.innovationSupports",
          "innovationSupports"
        )
        .andWhere("organisation_unit_id = :organisationUnitId", {
          organisationUnitId: organisationUnit.id,
        });
    }
    // handle the filters
    if (innovationStatus && innovationStatus.length > 0) {
      query.andWhere("innovationAction.status IN (:...statuses)", {
        statuses: innovationStatus,
      });
    }
    query.andWhere("innovationAction.status != :status", {
      status: InnovationActionStatus.DELETED,
    });

    if (innovationSection && innovationSection.length > 0) {
      query.andWhere("innovationSection.section IN (:...sections)", {
        sections: innovationSection,
      });
    }

    if (name && name.trim().length > 0) {
      query.andWhere("innovation.name like :name", {
        name: `%${name.trim().toLocaleLowerCase()}%`,
      });
    }
    // pagination
    query.take(take);
    query.skip(skip);

    if (order) {
      order["displayId"] &&
        query.orderBy("innovationAction.displayId", order["displayId"]);
      order["section"] &&
        query.orderBy("innovationSection.section", order["section"]);
      order["innovationName"] &&
        query.orderBy("innovation.name", order["innovationName"]);
      order["createdAt"] &&
        query.orderBy("innovationAction.createdAt", order["createdAt"]);
      order["status"] &&
        query.orderBy("innovationAction.status", order["status"]);
    } else {
      query.orderBy("innovationAction.createdAt", "DESC");
    }

    const [innovationActions, count] = await query.getManyAndCount();

    const notifications = await this.notificationService.getUnreadNotifications(
      requestUser,
      null,
      NotificationContextType.ACTION
    );

    const actions = innovationActions?.map((ia: InnovationAction) => {
      const unread = notifications.filter((n) => n.contextId === ia.id);

      return {
        id: ia.id,
        displayId: ia.displayId,
        innovation: {
          id: ia.innovationSection.innovation.id,
          name: ia.innovationSection.innovation.name,
        },
        status: ia.status,
        section: ia.innovationSection.section,
        createdAt: ia.createdAt,
        updatedAt: ia.updatedAt,
        notifications: {
          count: unread?.length || 0,
        },
        isOpen: [
          InnovationActionStatus.COMPLETED,
          InnovationActionStatus.DECLINED,
        ].includes(ia.status),
      };
    });

    return {
      data: actions,
      count: count,
    };
  }
}
