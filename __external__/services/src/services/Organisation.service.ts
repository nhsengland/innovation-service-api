import {
  AccessorOrganisationRole,
  Organisation,
  OrganisationType,
  OrganisationUnit,
  OrganisationUnitUser,
  OrganisationUser,
  User,
} from "@domain/index";
import {
  InvalidParamsError,
  InvalidUserRoleError,
  MissingUserOrganisationError,
  MissingUserOrganisationUnitError,
  InvalidOrganisationAcronymError,
} from "@services/errors";
import { OrganisationModel } from "@services/models/OrganisationModel";
import { OrganisationUnitUserModel } from "@services/models/OrganisationUnitUserModel";
import { RequestUser } from "@services/models/RequestUser";
import {
  Connection,
  getConnection,
  getRepository,
  In,
  Not,
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
  private readonly orgRepo: Repository<Organisation>;

  constructor(connectionName?: string) {
    super(Organisation, connectionName);
    this.connection = getConnection(connectionName);
    this.orgUserRepo = getRepository(OrganisationUser, connectionName);
    this.orgUnitRepo = getRepository(OrganisationUnit, connectionName);
    this.orgUnitUserRepo = getRepository(OrganisationUnitUser, connectionName);
    this.userService = new UserService(connectionName);
    this.orgRepo = getRepository(Organisation, connectionName);
  }

  async create(organisation: Organisation): Promise<Organisation> {
    return super.create(organisation);
  }

  async findAll(filter: any): Promise<Organisation[]> {
    if (!filter || !filter.type) {
      throw new InvalidParamsError(
        "Invalid filter. You must define the organisation type."
      );
    }

    if (filter.type !== OrganisationType.ACCESSOR) {
      throw new InvalidParamsError(
        "Invalid filter. You must define a valid organisation type."
      );
    }

    const filterOptions = {
      ...filter,
    };

    return await this.repository.find(filterOptions);
  }

  async findQualifyingAccessorsFromUnits(
    unitIds: string[],
    innovationId: string
  ): Promise<string[]> {
    if (!unitIds || unitIds.length === 0) return [];

    const query = this.orgUnitUserRepo
      .createQueryBuilder("unitUser")
      .select("user.id", "id")
      .innerJoin("unitUser.organisationUnit", "unit")
      .innerJoin("unitUser.organisationUser", "orgUser")
      .innerJoin("orgUser.user", "user")
      .innerJoin("orgUser.organisation", "organisation")
      .innerJoin(
        "organisation.innovationShares",
        "shares",
        "shares.id = :innovationId",
        { innovationId }
      )
      .where("unit.id in (:...unitIds) and orgUser.role = :role", {
        unitIds,
        role: AccessorOrganisationRole.QUALIFYING_ACCESSOR,
      });

    const units = await query.execute();

    return units.map((u) => u.id);
  }

  async findAllWithOrganisationUnits(): Promise<OrganisationModel[]> {
    const data = await this.repository
      .createQueryBuilder("organisation")
      .leftJoinAndSelect("organisation.organisationUnits", "organisationUnits")
      .where("organisation.type = :type", {
        type: OrganisationType.ACCESSOR,
      })
      .orderBy("organisation.name", "ASC")
      .getMany();

    return data.map((org: any) => {
      return {
        id: org.id,
        name: org.name,
        acronym: org.acronym,
        organisationUnits: org.__organisationUnits__?.map(
          (orgUnit: OrganisationUnit) => ({
            id: orgUnit.id,
            name: orgUnit.name,
            acronym: orgUnit.acronym,
          })
        ),
      };
    });
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

  async findUserFromUnitUsers(unitUsers: string[]): Promise<string[]> {
    if (!unitUsers) {
      throw new InvalidParamsError("unitUsers param must be defined.");
    }

    const users = await this.orgUnitUserRepo.find({
      where: { id: In(unitUsers) },
      relations: ["organisationUser", "organisationUser.user"],
    });

    return users.map((u) => u.organisationUser.user.id);
  }

  async findUserOrganisationUnitUsers(
    requestUser: RequestUser
  ): Promise<OrganisationUnitUserModel[]> {
    if (!requestUser) {
      throw new InvalidParamsError(
        "Invalid userId. You must define the user id."
      );
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

    // Get User organisation unit id
    const organisationUnits = [
      requestUser.organisationUnitUser.organisationUnit.id,
    ];

    // Get all users from the organisation unit
    const filterOptions = {
      relations: ["organisationUser", "organisationUser.user"],
      where: { organisationUnit: In(organisationUnits) },
    };
    const organisationUnitUsers = await this.orgUnitUserRepo.find(
      filterOptions
    );

    // Get user personal information from b2c
    const b2cMap = await this.findOrganisationUnitUsersNames(
      organisationUnitUsers,
      true
    );

    // create response
    const result = organisationUnitUsers
      .filter((organisationUnitUser) => {
        const organisationUser = organisationUnitUser.organisationUser;
        const name = b2cMap[organisationUser.user.id];
        if (name) return true;
        return false;
      })
      .map((organisationUnitUser: OrganisationUnitUser) => {
        const organisationUser = organisationUnitUser.organisationUser;

        return {
          id: organisationUnitUser.id,
          name: b2cMap[organisationUser.user.id],
        };
      });

    return result;
  }

  async findOrganisationUnitUsersNames(
    organisationUnitUsers: OrganisationUnitUser[],
    excludeLocked?: boolean
  ) {
    const userIds = organisationUnitUsers.map(
      (organisationUnitUser: OrganisationUnitUser) =>
        organisationUnitUser.organisationUser.user.id
    );
    const b2cUsers = await this.userService.getListOfUsers(
      userIds,
      excludeLocked
    );
    if (!b2cUsers) return [];

    return b2cUsers.reduce((map, obj) => {
      map[obj.id] = obj.displayName;
      return map;
    }, {});
  }

  async findOrganisationUnitById(
    organisationUnitId: string
  ): Promise<OrganisationUnit> {
    return this.orgUnitRepo.findOne(organisationUnitId);
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

  async acronymValidForOrganisationUpdate(
    acronym: string,
    organisationId: string
  ): Promise<boolean> {
    const filterAcronyms = {
      where: {
        id: Not(organisationId),
        acronym: acronym,
      },
      type: OrganisationType.ACCESSOR,
    };

    const acronymSearch = await this.findAll(filterAcronyms);

    if (acronymSearch.length == 0) {
      return true;
    }

    return false;
  }

  async updateOrganisationNameAcronym(
    organisationId: string,
    name: string,
    acronym: string
  ) {
    const acronymSearch = await this.acronymValidForOrganisationUpdate(
      acronym,
      organisationId
    );

    const filterOrgUnits = {
      where: {
        organisation: organisationId,
      },
    };

    const orgUnitSearch = await this.orgUnitRepo.find(filterOrgUnits);

    //If the desired Acronym is available, update the Organisation
    if (acronymSearch) {
      try {
        await this.connection.transaction(async (trs) => {
          const updatedOrgNameAcronym = await trs.update(
            Organisation,
            { id: organisationId },
            {
              type: OrganisationType.ACCESSOR,
              acronym: acronym,
              name: name,
            }
          );
        });
      } catch {
        throw new Error("Error updating Organisation.");
      }

      //If the Organisation only has 1 Unit, this Unit also needs to have its name and acronym changed
      if (orgUnitSearch.length == 1) {
        try {
          await this.connection.transaction(async (trs) => {
            const updatedOrgUnitNameAcronym = await trs.update(
              OrganisationUnit,
              { id: orgUnitSearch[0].id },
              {
                acronym: acronym,
                name: name,
              }
            );
          });
        } catch {
          throw new Error("Error updating Unit");
        }
      }
    } else {
      throw new InvalidOrganisationAcronymError(
        "Acronym already exists associated with another Organisation"
      );
    }
  }

  async findOrganisationById(organisationId: string): Promise<Organisation> {
    return this.orgRepo.findOne(organisationId);
  }
}
