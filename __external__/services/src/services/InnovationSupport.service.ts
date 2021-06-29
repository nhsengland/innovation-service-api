import {
  AccessorOrganisationRole,
  Comment,
  InnovationAction,
  InnovationActionStatus,
  InnovationSupport,
  InnovationSupportStatus,
  OrganisationUnitUser,
  OrganisationUser,
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
import { Connection, getConnection, getRepository, Repository } from "typeorm";
import { InnovationService } from "./Innovation.service";
import { OrganisationService } from "./Organisation.service";
import { UserService } from "./User.service";

export class InnovationSupportService {
  private readonly connection: Connection;
  private readonly supportRepo: Repository<InnovationSupport>;
  private readonly innovationService: InnovationService;
  private readonly organisationService: OrganisationService;
  private readonly userService: UserService;

  constructor(connectionName?: string) {
    this.connection = getConnection(connectionName);
    this.supportRepo = getRepository(InnovationSupport, connectionName);
    this.innovationService = new InnovationService(connectionName);
    this.organisationService = new OrganisationService(connectionName);
    this.userService = new UserService(connectionName);
  }

  async find(
    id: string,
    userId: string,
    innovationId: string,
    userOrganisations?: OrganisationUser[]
  ): Promise<InnovationSupportModel> {
    if (!id || !userId || !innovationId) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const innovation = await this.innovationService.findInnovation(
      innovationId,
      userId,
      null,
      userOrganisations
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
    userId: string,
    innovationId: string
  ): Promise<InnovationSupportModel[]> {
    if (!userId || !innovationId) {
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
      where: { owner: userId },
    };
    const innovation = await this.innovationService.findInnovation(
      innovationId,
      userId,
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

  async create(
    userId: string,
    innovationId: string,
    support: any,
    userOrganisations: OrganisationUser[]
  ) {
    if (!userId || !support) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    if (!userOrganisations || userOrganisations.length == 0) {
      throw new MissingUserOrganisationError(
        "Invalid user. User has no organisations."
      );
    }

    // BUSINESS RULE: An accessor has only one organization
    const userOrganisation = userOrganisations[0];

    if (
      !userOrganisation.userOrganisationUnits ||
      userOrganisation.userOrganisationUnits.length == 0
    ) {
      throw new MissingUserOrganisationUnitError(
        "Invalid user. User has no organisation units."
      );
    }

    if (
      userOrganisation.role !== AccessorOrganisationRole.QUALIFYING_ACCESSOR
    ) {
      throw new InvalidUserRoleError("Invalid user. User has an invalid role.");
    }

    // BUSINESS RULE: An accessor has only one organization unit
    const innovation = await this.innovationService.findInnovation(
      innovationId,
      userId,
      null,
      userOrganisations
    );
    if (!innovation) {
      throw new InnovationNotFoundError(
        "Invalid parameters. Innovation not found for the user."
      );
    }

    const organisationUnit =
      userOrganisation.userOrganisationUnits[0].organisationUnit;

    return await this.connection.transaction(async (transactionManager) => {
      if (support.comment) {
        const comment = Comment.new({
          user: { id: userId },
          innovation: innovation,
          message: support.comment,
          organisationUnit,
        });
        await transactionManager.save(Comment, comment);
      }

      const innovationSupport = {
        status: support.status,
        createdBy: userId,
        updatedBy: userId,
        innovation: { id: innovation.id },
        organisationUnit: { id: organisationUnit.id },
        organisationUnitUsers: support.accessors?.map((id) => ({ id })),
      };

      return await transactionManager.save(
        InnovationSupport,
        innovationSupport
      );
    });
  }

  async update(
    id: string,
    userId: string,
    innovationId: string,
    support: any,
    userOrganisations: OrganisationUser[]
  ) {
    if (!id || !userId || !innovationId || !support) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    if (!userOrganisations || userOrganisations.length == 0) {
      throw new MissingUserOrganisationError(
        "Invalid user. User has no organisations."
      );
    }

    // BUSINESS RULE: An accessor has only one organization
    const userOrganisation = userOrganisations[0];

    if (
      !userOrganisation.userOrganisationUnits ||
      userOrganisation.userOrganisationUnits.length == 0
    ) {
      throw new MissingUserOrganisationUnitError(
        "Invalid user. User has no organisation units."
      );
    }

    if (
      userOrganisation.role !== AccessorOrganisationRole.QUALIFYING_ACCESSOR
    ) {
      throw new InvalidUserRoleError("Invalid user. User has an invalid role.");
    }

    const innovation = await this.innovationService.findInnovation(
      innovationId,
      userId,
      null,
      userOrganisations
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

    const organisationUnit =
      userOrganisation.userOrganisationUnits[0].organisationUnit;

    return await this.connection.transaction(async (transactionManager) => {
      if (support.comment) {
        const comment = Comment.new({
          user: { id: userId },
          innovation: innovation,
          message: support.comment,
          createdBy: userId,
          updatedBy: userId,
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
            { status: InnovationActionStatus.DELETED, updatedBy: userId }
          );
        }
      } else {
        innovationSupport.organisationUnitUsers = support.accessors?.map(
          (id) => ({ id })
        );
      }

      innovationSupport.status = support.status;
      innovationSupport.updatedBy = userId;

      return await transactionManager.save(
        InnovationSupport,
        innovationSupport
      );
    });
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
