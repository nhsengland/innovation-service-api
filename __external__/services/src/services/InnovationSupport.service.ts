import { Activity } from "@domain/enums/activity.enums";
import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import {
  AccessorOrganisationRole,
  Comment,
  Innovation,
  InnovationAction,
  InnovationActionStatus,
  InnovationSupport,
  InnovationSupportLogType,
  InnovationSupportStatus,
  NotificationAudience,
  NotificationContextType,
  OrganisationUnitUser,
} from "@domain/index";
import {
  InnovationNotFoundError,
  InnovationSupportNotFoundError,
  InvalidParamsError,
  InvalidUserRoleError,
  MissingUserOrganisationError,
  MissingUserOrganisationUnitError,
  ResourceNotFoundError,
} from "@services/errors";
import { checkIfValidUUID } from "@services/helpers";
import { InnovationSupportModel } from "@services/models/InnovationSupportModel";
import { RequestUser } from "@services/models/RequestUser";
import { Connection, getConnection, getRepository, Repository } from "typeorm";
import { ActivityLogService } from "./ActivityLog.service";
import { InnovationService } from "./Innovation.service";
import { InnovationSupportLogService } from "./InnovationSupportLog.service";
import { LoggerService } from "./Logger.service";
import { NotificationService } from "./Notification.service";
import { OrganisationService } from "./Organisation.service";
import { UserService } from "./User.service";

export class InnovationSupportService {
  private readonly connection: Connection;
  private readonly supportRepo: Repository<InnovationSupport>;
  private readonly innovationService: InnovationService;
  private readonly innovationSupportLogService: InnovationSupportLogService;
  private readonly organisationService: OrganisationService;
  private readonly userService: UserService;
  private readonly notificationService: NotificationService;
  private readonly logService: LoggerService;
  private readonly activityLogService: ActivityLogService;

  constructor(connectionName?: string) {
    this.connection = getConnection(connectionName);
    this.supportRepo = getRepository(InnovationSupport, connectionName);
    this.innovationService = new InnovationService(connectionName);
    this.innovationSupportLogService = new InnovationSupportLogService(
      connectionName
    );
    this.organisationService = new OrganisationService(connectionName);
    this.userService = new UserService(connectionName);
    this.notificationService = new NotificationService(connectionName);
    this.activityLogService = new ActivityLogService(connectionName);
    this.logService = new LoggerService();
  }

  async find(
    requestUser: RequestUser,
    id: string,
    innovationId: string
  ): Promise<InnovationSupportModel> {
    if (
      !id ||
      !requestUser ||
      !innovationId ||
      !checkIfValidUUID(innovationId)
    ) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const innovation = await this.innovationService.findInnovation(
      requestUser,
      innovationId
    );
    if (!innovation) {
      throw new InnovationNotFoundError(
        "Invalid parameters. Innovation not found."
      );
    }

    const innovationSupport = await this.findOne(id, innovationId);
    if (!innovationSupport) {
      throw new InnovationSupportNotFoundError(
        "Invalid parameters. Innovation Support not found."
      );
    }

    // Get user personal information from b2c
    const organisationUnitUsers = innovationSupport.organisationUnitUsers;

    let b2cMap;
    if (organisationUnitUsers && organisationUnitUsers.length > 0) {
      b2cMap = await this.organisationService.findOrganisationUnitUsersNames(
        organisationUnitUsers
      );
    }

    return {
      id: innovationSupport.id,
      status: innovationSupport.status,
      accessors: organisationUnitUsers?.map(
        (organisationUnitUser: OrganisationUnitUser) => ({
          id: organisationUnitUser.id,
          name: b2cMap[organisationUnitUser.organisationUser.user.id],
        })
      ),
    };
  }

  async findAllByInnovation(
    requestUser: RequestUser,
    innovationId: string,
    full?: boolean
  ): Promise<InnovationSupportModel[]> {
    if (!requestUser || !innovationId || !checkIfValidUUID(innovationId)) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const filterOptions = {
      relations: [
        "innovationSupports",
        "innovationSupports.organisationUnit",
        "innovationSupports.organisationUnit.organisation",
        "innovationSupports.organisationUnitUsers",
        "innovationSupports.organisationUnitUsers.organisationUser",
        "innovationSupports.organisationUnitUsers.organisationUser.user",
      ],
      where: { owner: requestUser.id },
    };
    const innovation = await this.innovationService.findInnovation(
      requestUser,
      innovationId,
      filterOptions
    );
    if (!innovation) {
      throw new InnovationNotFoundError(
        "Invalid parameters. Innovation not found."
      );
    }
    const innovationSupports = innovation.innovationSupports;
    if (!innovationSupports || innovationSupports.length === 0) {
      return [];
    }

    let b2cUserNames;
    if (full) {
      const userIds = innovationSupports.flatMap((sup: InnovationSupport) => {
        if (sup.status === InnovationSupportStatus.ENGAGING) {
          return sup.organisationUnitUsers.map(
            (ouu: OrganisationUnitUser) => ouu.organisationUser.user.id
          );
        } else {
          return [];
        }
      });
      const b2cUsers = await this.userService.getListOfUsers(userIds);
      b2cUserNames = b2cUsers.reduce((map, obj) => {
        map[obj.id] = obj.displayName;
        return map;
      }, {});
    }

    return innovationSupports.map((sup: InnovationSupport) => {
      const organisationUnit = sup.organisationUnit;
      const organisation = organisationUnit.organisation;

      const response: InnovationSupportModel = {
        id: sup.id,
        status: sup.status,
        organisationUnit: {
          id: organisationUnit.id,
          name: organisationUnit.name,
          organisation: {
            id: organisation.id,
            name: organisation.name,
            acronym: organisation.acronym,
          },
        },
      };

      if (full && sup.status === InnovationSupportStatus.ENGAGING) {
        response.accessors = sup.organisationUnitUsers?.map(
          (organisationUnitUser: OrganisationUnitUser) => ({
            id: organisationUnitUser.id,
            name: b2cUserNames[organisationUnitUser.organisationUser.user.id],
          })
        );
      }

      return response;
    });
  }

  async findAllByInnovationAssessment(
    requestUser: RequestUser,
    innovationId: string,
    full?: boolean
  ): Promise<InnovationSupportModel[]> {
    if (!requestUser || !innovationId || !checkIfValidUUID(innovationId)) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const filterOptions = {
      relations: [
        "innovationSupports",
        "innovationSupports.organisationUnit",
        "innovationSupports.organisationUnit.organisation",
        "innovationSupports.organisationUnitUsers",
        "innovationSupports.organisationUnitUsers.organisationUser",
        "innovationSupports.organisationUnitUsers.organisationUser.user",
      ],
    };
    const innovation = await this.innovationService.findInnovation(
      requestUser,
      innovationId,
      filterOptions
    );
    if (!innovation) {
      throw new InnovationNotFoundError(
        "Invalid parameters. Innovation not found."
      );
    }
    const innovationSupports = innovation.innovationSupports;
    if (!innovationSupports || innovationSupports.length === 0) {
      return [];
    }

    let b2cUserNames;
    if (full) {
      const userIds = innovationSupports.flatMap((sup: InnovationSupport) => {
        if (sup.status === InnovationSupportStatus.ENGAGING) {
          return sup.organisationUnitUsers.map(
            (ouu: OrganisationUnitUser) => ouu.organisationUser.user.id
          );
        } else {
          return [];
        }
      });
      const b2cUsers = await this.userService.getListOfUsers(userIds);
      b2cUserNames = b2cUsers.reduce((map, obj) => {
        map[obj.id] = obj.displayName;
        return map;
      }, {});
    }

    return innovationSupports.map((sup: InnovationSupport) => {
      const organisationUnit = sup.organisationUnit;
      const organisation = organisationUnit.organisation;

      const response: InnovationSupportModel = {
        id: sup.id,
        status: sup.status,
        organisationUnit: {
          id: organisationUnit.id,
          name: organisationUnit.name,
          organisation: {
            id: organisation.id,
            name: organisation.name,
            acronym: organisation.acronym,
          },
        },
      };

      if (full && sup.status === InnovationSupportStatus.ENGAGING) {
        response.accessors = sup.organisationUnitUsers?.map(
          (organisationUnitUser: OrganisationUnitUser) => ({
            id: organisationUnitUser.id,
            name: b2cUserNames[organisationUnitUser.organisationUser.user.id],
          })
        );
      }

      return response;
    });
  }

  async create(requestUser: RequestUser, innovationId: string, support: any) {
    if (!requestUser || !support) {
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

    const organisationUser = requestUser.organisationUser;
    if (
      organisationUser.role !== AccessorOrganisationRole.QUALIFYING_ACCESSOR
    ) {
      throw new InvalidUserRoleError("Invalid user. User has an invalid role.");
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

    const organisationUnit = requestUser.organisationUnitUser.organisationUnit;

    let targetNotificationUsers: string[] = [];

    const result = await this.connection.transaction(
      async (transactionManager) => {
        if (support.comment) {
          const comment = Comment.new({
            user: { id: requestUser.id },
            innovation: innovation,
            message: support.comment,
            createdBy: requestUser.id,
            updatedBy: requestUser.id,
            organisationUnit,
          });
          await transactionManager.save(Comment, comment);
        }

        const innovationSupport = {
          status: support.status,
          createdBy: requestUser.id,
          updatedBy: requestUser.id,
          innovation: { id: innovation.id },
          organisationUnit: { id: organisationUnit.id },
          organisationUnitUsers: support.accessors?.map((id) => ({ id })),
        };

        const usersToBeNotified =
          innovationSupport.organisationUnitUsers?.map((u) => u.id) || [];
        targetNotificationUsers = await this.organisationService.findUserFromUnitUsers(
          usersToBeNotified
        );

        return await transactionManager.save(
          InnovationSupport,
          innovationSupport
        );
      }
    );

    try {
      await this.notificationService.create(
        requestUser,
        NotificationAudience.ACCESSORS,
        innovationId,
        NotificationContextType.INNOVATION,

        innovationId,
        `Support was created for the Innovation with id ${innovationId} with the status ${support.status}`,
        targetNotificationUsers
      );
    } catch (error) {
      this.logService.error(
        `An error has occured while creating a notification of type ${NotificationContextType.INNOVATION} from ${requestUser.id}`,
        error
      );
    }

    try {
      const innovation = await this.innovationService.find(innovationId, {
        relations: ["owner"],
      });

      const owner = innovation.owner.id;
      await this.notificationService.sendEmail(
        requestUser,
        EmailNotificationTemplate.INNOVATORS_SUPPORT_STATUS_UPDATE,
        innovationId,
        innovationId,
        [owner],
        {
          organisation_name: organisationUnit.name,
          innovation_name: innovation.name,
        }
      );
    } catch (error) {
      this.logService.error(
        `An error has occured while sending an email with template ${EmailNotificationTemplate.INNOVATORS_SUPPORT_STATUS_UPDATE} from ${requestUser.id}`,
        error
      );
    }

    if (
      support.status === InnovationSupportStatus.ENGAGING ||
      support.status === InnovationSupportStatus.COMPLETE
    ) {
      try {
        await this.createSupportLog(
          requestUser,
          innovation,
          support.comment,
          support.status
        );
      } catch (error) {
        this.logService.error(
          `An error has occured while creating support log from ${requestUser.id}`,
          error
        );
      }
    }

    try {
      await this.activityLogService.create(
        requestUser,
        innovation,
        Activity.SUPPORT_STATUS_UPDATE
      );
    } catch (error) {
      this.logService.error(
        `An error has occured while creating activity log from ${requestUser.id}`,
        error
      );
    }

    return result;
  }

  async update(
    requestUser: RequestUser,
    id: string,
    innovationId: string,
    support: any
  ) {
    if (!id || !requestUser || !innovationId || !support) {
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

    const userOrganisation = requestUser.organisationUser;
    if (
      userOrganisation.role !== AccessorOrganisationRole.QUALIFYING_ACCESSOR
    ) {
      throw new InvalidUserRoleError("Invalid user. User has an invalid role.");
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

    const innovationSupport = await this.findOne(id, innovationId);
    if (!innovationSupport) {
      throw new ResourceNotFoundError("Innovation Support not found!");
    }

    const organisationUnit = requestUser.organisationUnitUser.organisationUnit;

    const result = await this.connection.transaction(
      async (transactionManager) => {
        if (support.comment) {
          const comment = Comment.new({
            user: { id: requestUser.id },
            innovation: innovation,
            message: support.comment,
            createdBy: requestUser.id,
            updatedBy: requestUser.id,
            organisationUnit,
          });
          await transactionManager.save(Comment, comment);
        }

        if (
          innovationSupport.status === InnovationSupportStatus.ENGAGING &&
          innovationSupport.status !== support.status
        ) {
          innovationSupport.organisationUnitUsers = [];
          const innovationActions = await innovationSupport.actions;

          const actions = innovationActions.filter(
            (ia: InnovationAction) =>
              ia.status === InnovationActionStatus.REQUESTED ||
              ia.status === InnovationActionStatus.STARTED ||
              ia.status === InnovationActionStatus.IN_REVIEW
          );

          for (let i = 0; i < actions.length; i++) {
            await transactionManager.update(
              InnovationAction,
              { id: actions[i].id },
              {
                status: InnovationActionStatus.DELETED,
                updatedBy: requestUser.id,
              }
            );
          }
        } else {
          innovationSupport.organisationUnitUsers = support.accessors?.map(
            (id) => ({ id })
          );
        }

        innovationSupport.status = support.status;
        innovationSupport.updatedBy = requestUser.id;

        if (
          [
            InnovationSupportStatus.WITHDRAWN,
            InnovationSupportStatus.NOT_YET,
            InnovationSupportStatus.WAITING,
          ].includes(innovationSupport.status)
        ) {
          try {
            await this.notificationService.create(
              requestUser,
              NotificationAudience.ASSESSMENT_USERS,
              innovationId,
              NotificationContextType.INNOVATION,
              innovationId,
              `The innovation with id ${innovationId} has had its support status changed to ${innovationSupport.status}`
            );
          } catch (error) {
            this.logService.error(
              `An error has occured while creating a notification of type ${NotificationContextType.INNOVATION} from ${requestUser.id}`,
              error
            );
          }
        }

        if (
          innovationSupport.status === InnovationSupportStatus.ENGAGING ||
          innovationSupport.status === InnovationSupportStatus.COMPLETE
        ) {
          try {
            await this.notificationService.create(
              requestUser,
              NotificationAudience.ACCESSORS,
              innovationId,
              NotificationContextType.INNOVATION,
              innovationId,
              `The innovation with id ${innovationId} has had its support status changed to ${innovationSupport.status}`
            );
          } catch (error) {
            this.logService.error(
              `An error has occured while creating a notification of type ${NotificationContextType.INNOVATION} from ${requestUser.id}`,
              error
            );
          }

          try {
            const targetUsers = await this.organisationService.findUserFromUnitUsers(
              innovationSupport.organisationUnitUsers.map((u) => u.id)
            );

            await this.notificationService.sendEmail(
              requestUser,
              EmailNotificationTemplate.ACCESSORS_ASSIGNED_TO_INNOVATION,
              innovationId,
              innovationId,
              targetUsers
            );
          } catch (error) {
            this.logService.error(
              `An error has occured while sending an email with template ${EmailNotificationTemplate.ACCESSORS_ASSIGNED_TO_INNOVATION} from ${requestUser.id}`,
              error
            );
          }

          try {
            await this.createSupportLog(
              requestUser,
              innovation,
              support.comment,
              innovationSupport.status
            );
          } catch (error) {
            this.logService.error(
              `An error has occured while creating support log from ${requestUser.id}`,
              error
            );
          }
        }

        try {
          const innovation = await this.innovationService.find(innovationId, {
            relations: ["owner"],
          });

          const owner = innovation.owner.id;
          await this.notificationService.sendEmail(
            requestUser,
            EmailNotificationTemplate.INNOVATORS_SUPPORT_STATUS_UPDATE,
            innovationId,
            innovationId,
            [owner],
            {
              organisation_name: organisationUnit.name,
              innovation_name: innovation.name,
            }
          );
        } catch (error) {
          this.logService.error(
            `An error has occured while sending an email with template ${EmailNotificationTemplate.INNOVATORS_SUPPORT_STATUS_UPDATE} from ${requestUser.id}`,
            error
          );
        }
        return await transactionManager.save(
          InnovationSupport,
          innovationSupport
        );
      }
    );

    return result;
  }

  private async findOne(
    id: string,
    innovationId: string
  ): Promise<InnovationSupport> {
    const filterOptions = {
      where: { innovation: innovationId },
      relations: [
        "organisationUnitUsers",
        "organisationUnitUsers.organisationUser",
        "organisationUnitUsers.organisationUser.user",
      ],
    };

    return await this.supportRepo.findOne(id, filterOptions);
  }

  private async createSupportLog(
    requestUser: RequestUser,
    innovation: Innovation,
    comment: string,
    supportStatus: InnovationSupportStatus
  ) {
    return await this.innovationSupportLogService.create(
      requestUser,
      innovation.id,
      {
        type: InnovationSupportLogType.STATUS_UPDATE,
        description: comment || "",
        innovationSupportStatus: supportStatus,
      },
      innovation
    );
  }
}
