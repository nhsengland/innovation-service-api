import {
  AccessorOrganisationRole,
  Organisation,
  OrganisationUnit,
  OrganisationUnitUser,
  OrganisationUser,
  User,
} from "@domain/index";
import {
  InvalidParamsError,
  InvalidUserRoleError,
  MissingUserOrganisationError,
} from "@services/errors";
import { OrganisationUnitUserModel } from "@services/models/OrganisationUnitUserModel";
import {
  Connection,
  getConnection,
  getRepository,
  In,
  Repository,
} from "typeorm";
import { BaseService } from "./Base.service";
import { UserService } from "./User.service";

export class OrganisationService extends BaseService<Organisation> {
  private readonly connection: Connection;
  private readonly orgUnitRepo: Repository<OrganisationUnit>;
  private readonly orgUnitUserRepo: Repository<OrganisationUnitUser>;
  private readonly orgUserRepo: Repository<OrganisationUser>;
  private readonly userService: UserService;

  constructor(connectionName?: string) {
    super(Organisation, connectionName);
    this.connection = getConnection(connectionName);
    this.orgUserRepo = getRepository(OrganisationUser, connectionName);
    this.orgUnitRepo = getRepository(OrganisationUnit, connectionName);
    this.orgUnitUserRepo = getRepository(OrganisationUnitUser, connectionName);
    this.userService = new UserService(connectionName);
  }

  async create(organisation: Organisation): Promise<Organisation> {
    return super.create(organisation);
  }

  async findAll(filter: any): Promise<Organisation[]> {
    if (!filter.type) {
      throw new InvalidParamsError(
        "Invalid filter. You must define the organisation type."
      );
    }

    const filterOptions = {
      ...filter,
    };

    return await this.repository.find(filterOptions);
  }

  async findUserOrganisations(userId: string): Promise<OrganisationUser[]> {
    return await this.orgUserRepo.find({
      where: {
        user: userId,
      },
      relations: [
        "user",
        "organisation",
        "userOrganisationUnits",
        "userOrganisationUnits.organisationUnit",
      ],
    });
  }

  async findUserOrganisationUnitUsers(
    userId: string,
    userOrganisations: OrganisationUser[]
  ): Promise<OrganisationUnitUserModel[]> {
    if (!userId) {
      throw new InvalidParamsError(
        "Invalid userId. You must define the user id."
      );
    }

    if (!userOrganisations || userOrganisations.length == 0) {
      throw new MissingUserOrganisationError(
        "Invalid user. User has no organisations."
      );
    }

    // BUSINESS RULE: An accessor has only one organization
    const userOrganisation = userOrganisations[0];

    if (
      userOrganisation.role !== AccessorOrganisationRole.QUALIFYING_ACCESSOR
    ) {
      throw new InvalidUserRoleError("Invalid user. User has an invalid role.");
    }

    // Get all user organisation units
    const organisationUnits = userOrganisation?.userOrganisationUnits.map(
      (uou: OrganisationUnitUser) => uou?.organisationUnit.id
    );
    if (!organisationUnits) return [];

    // Get all users from the organisation units
    const filterOptions = {
      relations: ["organisationUser", "organisationUser.user"],
      where: { organisationUnit: In(organisationUnits) },
    };
    const organisationUnitUsers = await this.orgUnitUserRepo.find(
      filterOptions
    );

    // Get user personal information from b2c
    const b2cMap = await this.getOrganisationUnitUsersNames(
      organisationUnitUsers
    );

    // create response
    return organisationUnitUsers.map(
      (organisationUnitUser: OrganisationUnitUser) => {
        const organisationUser = organisationUnitUser.organisationUser;

        return {
          id: organisationUnitUser.id,
          name: b2cMap[organisationUser.user.id],
        };
      }
    );
  }

  async getOrganisationUnitUsersNames(
    organisationUnitUsers: OrganisationUnitUser[]
  ) {
    const userIds = organisationUnitUsers.map(
      (organisationUnitUser: OrganisationUnitUser) =>
        organisationUnitUser.organisationUser.user.id
    );
    const b2cUsers = await this.userService.getListOfUsers(userIds);
    if (!b2cUsers) return [];

    return b2cUsers.reduce((map, obj) => {
      map[obj.id] = obj.displayName;
      return map;
    }, {});
  }

  async addUserToOrganisation(
    user: User,
    organisation: Organisation,
    role: string
  ): Promise<OrganisationUser> {
    const orgUserObj = OrganisationUser.new({
      organisation,
      user,
      role,
    });

    try {
      return await this.orgUserRepo.save(orgUserObj);
    } catch (error) {
      throw error;
    }
  }

  async addUserToOrganisationUnit(
    organisationUser: OrganisationUser,
    organisationUnit: OrganisationUnit
  ): Promise<OrganisationUnitUser> {
    const orgUnitUserObj = OrganisationUnitUser.new({
      organisationUnit,
      organisationUser,
    });

    try {
      return await this.orgUnitUserRepo.save(orgUnitUserObj);
    } catch (error) {
      throw error;
    }
  }

  async addOrganisationUnit(unit: OrganisationUnit): Promise<OrganisationUnit> {
    return await this.orgUnitRepo.save(unit);
  }
}
