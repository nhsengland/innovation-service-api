import {
  AccessorOrganisationRole,
  Comment,
  InnovationAction,
  InnovationActionStatus,
  InnovationSupport,
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
import { InnovationSupportModel } from "@services/models/InnovationSupportModel";
import { RequestUser } from "@services/models/RequestUser";
import { Connection, getConnection, getRepository, Repository } from "typeorm";
import { InnovationService } from "./Innovation.service";
import { OrganisationService } from "./Organisation.service";
import { UserService } from "./User.service";
import { NotificationService } from "./Notification.service";

export class InnovationSupportService {
  private readonly connection: Connection;
  private readonly supportRepo: Repository<InnovationSupport>;
  private readonly innovationService: InnovationService;
  private readonly organisationService: OrganisationService;
  private readonly userService: UserService;
  private readonly notificationService: NotificationService;

  constructor(connectionName?: string) {
    this.connection = getConnection(connectionName);
    this.supportRepo = getRepository(InnovationSupport, connectionName);
    this.innovationService = new InnovationService(connectionName);
    this.organisationService = new OrganisationService(connectionName);
    this.userService = new UserService(connectionName);
    this.notificationService = new NotificationService(connectionName);
  }

  async find(
    requestUser: RequestUser,
    id: string,
    innovationId: string
  ): Promise<InnovationSupportModel> {
    if (!id || !requestUser || !innovationId) {
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
      b2cMap = await this.organisationService.getOrganisationUnitUsersNames(
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
    innovationId: string
  ): Promise<InnovationSupportModel[]> {
    if (!requestUser || !innovationId) {
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
    const b2cUserNames = b2cUsers.reduce((map, obj) => {
      map[obj.id] = obj.displayName;
      return map;
    }, {});

    return innovationSupports.map((sup: InnovationSupport) => {
      const organisationUnit = sup.organisationUnit;
      const organisation = organisationUnit.organisation;
      let accessors = [];

      if (sup.status === InnovationSupportStatus.ENGAGING) {
        accessors = sup.organisationUnitUsers?.map(
          (organisationUnitUser: OrganisationUnitUser) => ({
            id: organisationUnitUser.id,
            name: b2cUserNames[organisationUnitUser.organisationUser.user.id],
          })
        );
      }

      return {
        id: sup.id,
        status: sup.status,
        organisation: {
          id: organisation.id,
          name: organisation.name,
          acronym: organisation.acronym,
        },
        organisationUnit: {
          id: organisationUnit.id,
          name: organisationUnit.name,
        },
        accessors,
      };
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

    await this.notificationService.create(
      requestUser,
      NotificationAudience.ACCESSORS,
      innovationId,
      NotificationContextType.INNOVATION,
      innovationId,
      `The Innovation with id ${innovationId} was assigned to the accessors of ${requestUser.organisationUnitUser.organisationUnit.name}`,
      targetNotificationUsers
    );

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
          const usersToBeNotified =
            innovationSupport.organisationUnitUsers?.map((u) => u.id) || [];
          targetNotificationUsers = await this.organisationService.findUserFromUnitUsers(
            usersToBeNotified
          );
        }

        innovationSupport.status = support.status;
        innovationSupport.updatedBy = requestUser.id;

        return await transactionManager.save(
          InnovationSupport,
          innovationSupport
        );
      }
    );

    await this.notificationService.create(
      requestUser,
      NotificationAudience.ACCESSORS,
      innovationId,
      NotificationContextType.INNOVATION,
      innovationId,
      `The support for the Innovation with id ${innovationId} was updated and notification was created for the accessors of ${requestUser.organisationUnitUser.organisationUnit.name}`,
      targetNotificationUsers
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
}
