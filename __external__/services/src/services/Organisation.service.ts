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
} from "@services/errors";
import { OrganisationModel } from "@services/models/OrganisationModel";
import { OrganisationUnitUserModel } from "@services/models/OrganisationUnitUserModel";
import { OrganisationUpdateResult } from "@services/models/OrganisationUpdateResult";
import { ProfileSlimModel } from "@services/models/ProfileSlimModel";
import { RequestUser } from "@services/models/RequestUser";
import { number } from "joi";
import {
  Connection,
  EntityManager,
  EntityMetadata,
  FindOneOptions,
  FindOptionsUtils,
  getConnection,
  getRepository,
  In,
  IsNull,
  Not,
  Repository,
  SelectQueryBuilder,
} from "typeorm";
import { isNull } from "util";
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
      inactivatedAt: IsNull(),
    };

    return await this.repository.find(filterOptions);
  }

  async findAllUnits(
    filter: any,
    excludeInactive?: boolean
  ): Promise<OrganisationUnit[]> {
    if (!filter) {
      throw new InvalidParamsError("Invalid filter.");
    }

    let filterOptions = {
      ...filter,
    };

    if (excludeInactive) {
      filterOptions = {
        ...filterOptions,
        inactivatedAt: IsNull(),
      };
    }

    return await this.orgUnitRepo.find(filterOptions);
  }

  async findQualifyingAccessorsFromUnits(
    unitIds: string[],
    innovationId: string
  ): Promise<ProfileSlimModel[]> {
    if (!unitIds || unitIds.length === 0) return [];

    const query = this.orgUnitUserRepo
      .createQueryBuilder("unitUser")
      .select("user.id", "id")
      .addSelect("user.external_id", "externalId")
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

    return units.map((u) => ({
      id: u.id,
      externalId: u.externalId,
    }));
  }

  async findAllWithOrganisationUnits(): Promise<OrganisationModel[]> {
    const data = await this.repository
      .createQueryBuilder("organisation")
      .leftJoinAndSelect("organisation.organisationUnits", "organisationUnits")
      .where("organisation.type = :type", {
        type: OrganisationType.ACCESSOR,
      })
      .andWhere("organisationUnits.inactivated_at IS NULL")
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
    const query = this.orgUserRepo
      .createQueryBuilder("organisationUser")
      .leftJoinAndSelect("organisationUser.organisation", "org")
      .leftJoinAndSelect("org.organisationUnits", "units")
      .leftJoinAndSelect("organisationUser.user", "usr")
      .where("usr.id = :userId", { userId })
      .andWhere("units.inactivated_at is NULL")
      .andWhere("org.inactivated_at is NULL");

    return await query.getMany();
  }

  async findUserFromUnitUsers(
    unitUsers: string[]
  ): Promise<ProfileSlimModel[]> {
    if (!unitUsers) {
      throw new InvalidParamsError("unitUsers param must be defined.");
    }

    const users = await this.orgUnitUserRepo.find({
      where: { id: In(unitUsers) },
      relations: ["organisationUser", "organisationUser.user"],
    });

    return users.map((u) => ({
      id: u.organisationUser.user.id,
      externalId: u.organisationUser.user.externalId,
    }));
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
        const name = b2cMap[organisationUser.user.externalId];
        if (name) return true;
        return false;
      })
      .map((organisationUnitUser: OrganisationUnitUser) => {
        const organisationUser = organisationUnitUser.organisationUser;

        return {
          id: organisationUnitUser.id,
          name: b2cMap[organisationUser.user.externalId],
        };
      });

    return result;
  }

  async findOrganisationUnitUsersNames(
    organisationUnitUsers: OrganisationUnitUser[],
    excludeLocked?: boolean
  ) {
    const externalIds = organisationUnitUsers.map(
      (organisationUnitUser: OrganisationUnitUser) =>
        organisationUnitUser.organisationUser.user.externalId
    );
    const b2cUsers = await this.userService.getListOfUsers(
      externalIds,
      excludeLocked
    );
    if (!b2cUsers) return [];

    return b2cUsers.reduce((map, obj) => {
      map[obj.id] = obj.displayName;
      return map;
    }, {});
  }

  async findOrganisationUnitById(
    organisationUnitId: string,
    options?: FindOneOptions<OrganisationUnit>
  ): Promise<OrganisationUnit> {
    return this.orgUnitRepo.findOne(organisationUnitId, options);
  }

  async findOrganisationUnitsByIds(
    organisationUnitIds: string[]
  ): Promise<OrganisationUnit[]> {
    const units = await this.orgUnitRepo.find({
      relations: ["organisation"],
      where: { id: In(organisationUnitIds) },
    });

    return units;
  }

  async organisationActiveUnitsCount(
    organisationId: string,
    transaction?: EntityManager
  ): Promise<{ count: number }> {
    if (transaction) {
      const count = await transaction
        .createQueryBuilder(OrganisationUnit, "unit")
        .where("unit.inactivatedAt IS NULL")
        .andWhere("unit.organisation_id = :organisationId", { organisationId })
        .getCount();

      return { count };
    }

    const count = await this.orgUnitRepo
      .createQueryBuilder("unit")
      .where("unit.inactivatedAt IS NULL")
      .andWhere("unit.organisation_id = :organisationId", { organisationId })
      .getCount();

    return {
      count,
    };
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

  async findOrganisationById(
    organisationId: string
  ): Promise<OrganisationModel> {
    const org = await this.repository
      .createQueryBuilder("organisation")
      .leftJoinAndSelect("organisation.organisationUnits", "units")
      .leftJoinAndSelect("units.organisationUnitUsers", "unit_users" ) // so that the relation is loaded in the entity.
      .leftJoinAndSelect("unit_users.organisationUnit", "user_unit") // so that the relation is loaded in the entity. required to get a mapping of user counts
      .where("organisation.type = :type", {
        type: OrganisationType.ACCESSOR,
      })
      .andWhere("organisation.id = :id", {
        id: organisationId,
      })
      .andWhere("units.inactivated_at IS NULL")
      .getOne();

    const orgUnits = await org.organisationUnits;
    const usersFromEachUnit = await Promise.all(orgUnits.map( u => u.organisationUnitUsers));
    const users = usersFromEachUnit.flatMap(ufeu => ufeu.map(u => ({
      unit: u.organisationUnit.id,
      count: ufeu.length
    })))

    return {
      id: org.id,
      name: org.name,
      acronym: org.acronym,
      organisationUnits: orgUnits?.map((unit) => {
        
        const usersCount = users.find(u => u.unit === unit.id)?.count || 0;

        return {
          id: unit.id,
          name: unit.name,
          acronym: unit.acronym,
          isActive: unit.inactivatedAt == null, // juggle undefined or null
          usersCount,
        };
      }),
    };
  }

  async acronymValidForOrganisationUpdate(
    acronym: string,
    organisationId?: string,
    organisationUnitId?: string
  ): Promise<boolean> {
    let acronymSearch, filterAcronyms;
    if (organisationId) {
      filterAcronyms = {
        where: {
          id: Not(organisationId),
          acronym: acronym,
        },
        type: OrganisationType.ACCESSOR,
      };

      acronymSearch = await this.findAll(filterAcronyms);
    } else if (organisationUnitId) {
      filterAcronyms = {
        where: {
          id: Not(organisationUnitId),
          acronym: acronym,
        },
      };

      acronymSearch = await this.findAllUnits(filterAcronyms);
    }

    if (acronymSearch.length === 0) {
      return false;
    }

    return true;
  }

  async updateOrganisation(
    organisationId: string,
    name: string,
    acronym: string
  ): Promise<OrganisationUpdateResult> {
    if (!name || !acronym || !organisationId) {
      throw new InvalidParamsError("Invalid params.");
    }

    if (acronym.length > 10) {
      throw new Error("Acronym has a maximum of 10 characters");
    }

    if (name.length > 100) {
      throw new Error("Name has a maximum of 100 characters");
    }

    const acronymSearch = await this.acronymValidForOrganisationUpdate(
      acronym,
      organisationId,
      null
    );

    const filterOrgUnits = {
      where: {
        organisation: organisationId,
      },
    };

    const orgUnitSearch = await this.orgUnitRepo.find(filterOrgUnits);

    //If the desired Acronym is available, update the Organisation
    if (!acronymSearch) {
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
        return {
          id: null,
          status: "ERROR",
          error: "Error updating Organisation",
        };
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
          return {
            id: null,
            status: "ERROR",
            error:
              "Error updating Unique Organisation Unit inside this Organisation",
          };
        }
      }
      return {
        id: organisationId,
        status: "OK",
      };
    } else {
      return {
        id: null,
        status: "ERROR",
        error: "Acronym already exists associated with another Organisation",
      };
    }
  }

  async updateOrganisationUnit(
    organisationUnitId: string,
    name: string,
    acronym: string
  ): Promise<OrganisationUpdateResult> {
    if (!name || !acronym || !organisationUnitId) {
      throw new InvalidParamsError("Invalid params.");
    }

    if (acronym.length > 10) {
      throw new Error("Acronym has a maximum of 10 characters");
    }

    if (name.length > 100) {
      throw new Error("Name has a maximum of 100 characters");
    }

    const acronymSearch = await this.acronymValidForOrganisationUpdate(
      acronym,
      null,
      organisationUnitId
    );

    const filterOrgUnits = {
      where: {
        id: organisationUnitId,
      },
    };

    const orgUnitSearch = await this.orgUnitRepo.find(filterOrgUnits);

    if (!acronymSearch) {
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
        return {
          id: organisationUnitId,
          status: "OK",
        };
      } catch {
        return {
          id: null,
          status: "ERROR",
          error: "Error updating Organisation Unit",
        };
      }
    } else {
      return {
        id: null,
        status: "ERROR",
        error:
          "Acronym already exists associated with another Organisation Unit",
      };
    }
  }

  async findOrganisationUnitUsersById(
    organisationUnitId: string
  ): Promise<OrganisationUnitUserModel[]> {
    if (!organisationUnitId) {
      throw new InvalidParamsError(
        "Invalid organisation unit id. You must define the id."
      );
    }

    const filterOptions = {
      relations: ["organisationUser", "organisationUser.user"],
      where: { organisationUnit: organisationUnitId },
    };
    const orgUnitUsers = await this.orgUnitUserRepo.find(filterOptions);

    const b2cMap = await this.findOrganisationUnitUsersNames(
      orgUnitUsers,
      true
    );

    const result = orgUnitUsers
      .filter((orgUnitUsers) => {
        const organisationUser = orgUnitUsers.organisationUser;
        const name = b2cMap[organisationUser.user.externalId];
        if (name) return true;
        return false;
      })
      .map((organisationUnitUser: OrganisationUnitUser) => {
        const organisationUser = organisationUnitUser.organisationUser;

        return {
          id: organisationUnitUser.id,
          name: b2cMap[organisationUser.user.externalId],
          role: organisationUser.role,
          userId: organisationUser.user.id,
        };
      });

    return result;
  }

  async findOrganisationUnitsUsersByUnitIds(
    organisationUnitIds: string[]
  ): Promise<
    {
      externalId: string;
      id: string;
    }[]
  > {
    const filterOptions = {
      relations: ["organisationUser", "organisationUser.user"],
      where: { organisationUnit: In(organisationUnitIds) },
    };
    const orgUnitUsers = await this.orgUnitUserRepo.find(filterOptions);

    const result = orgUnitUsers.map((user) => ({
      externalId: user.organisationUser.user.externalId,
      id: user.organisationUser.user.id,
    }));

    return result;
  }
}
