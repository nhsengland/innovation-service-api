import {
  AccessorOrganisationRole,
  Innovation,
  InnovationSupportStatus,
  OrganisationUnitUser,
  OrganisationUser,
  User,
  UserType,
} from "@domain/index";
import { InvalidParamsError, InvalidUserRoleError } from "@services/errors";
import { RequestUser } from "@services/models/RequestUser";
import {
  UserLockResult,
  UserUnlockResult,
} from "@services/models/UserLockResult";
import { UserLockValidationResult } from "@services/models/UserLockValidationResult";
import { UserUpdateResult } from "@services/models/UserUpdateResult";
import {
  UserChangeRoleValidationCode,
  UserLockValidationCode,
  UserSearchResult,
} from "@services/types";
import { Connection, getConnection } from "typeorm";
import { UserService } from "..";
import { authenticateWitGraphAPI, getUserFromB2C } from "../helpers";
import * as rules from "../config/admin-user-lock.config.json";
import * as rule from "../config/admin-change-role.config.json";
import { UserCreationModel } from "@services/models/UserCreationModel";
import { UserCreationResult } from "@services/models/UserCreationResult";
import { UserChangeRoleValidationResult } from "@services/models/UserChangeRoleValidationResult";
import { OrganisationService } from "./Organisation.service";
import { OrganisationUpdateResult } from "@services/models/OrganisationUpdateResult";

export class AdminService {
  private readonly connection: Connection;
  private readonly userService: UserService;
  private readonly organisationService: OrganisationService;

  constructor(connectionName?: string) {
    this.connection = getConnection(connectionName);
    this.userService = new UserService(connectionName);
    this.organisationService = new OrganisationService(connectionName);
  }
  async getUsersOfType(
    type: UserType,
    skip = 0,
    take = 10
  ): Promise<UserSearchResult[]> {
    const users = await this.userService.getUsersOfTypePaged(type, skip, take);
    const b2cUsers = await this.userService.getListOfUsers(
      users.map((u) => u.id),
      false
    );

    const result: UserSearchResult[] = [];

    for (const user of users) {
      const b2c = b2cUsers.find((u) => u.id === user.id);
      const userOrganisations = await user.userOrganisations;
      if (b2c) {
        result.push({
          id: user.id,
          type: user.type,
          displayName: b2c.displayName,
          email: b2c.email,
          lockedAt: user.lockedAt,
          userOrganisations: userOrganisations?.map((o) => ({
            id: o.id,
            name: o.organisation.name,
            role: o.role,
            units: o.userOrganisationUnits?.map((unit) => ({
              id: unit.id,
              name: unit.organisationUnit.name,
            })),
          })),
          serviceRoles: user.serviceRoles,
        });
      }
    }

    return result;
  }

  async searchUser(
    email: string,
    isAdmin: boolean
  ): Promise<UserSearchResult[]> {
    const result = await this.userService.searchUserByEmail(email);
    let response: UserSearchResult[] = [];
    // for now, search user by email only yield 0...1 results
    // frontend is expecting an array
    if (!result) {
      return [];
    }
    if (isAdmin && result.type === UserType.ADMIN) {
      response = [result];
    } else if (!isAdmin && result.type != UserType.ADMIN) {
      response = [result];
    }

    return response;
  }

  async getUserDetails(
    userId: string,
    minimal?: "MINIMAL" | "FULL"
  ): Promise<any> {
    const result = await this.userService.getUserDetails(userId, minimal);

    return result;
  }

  async lockUsers(
    requestUser: RequestUser,
    user: string
  ): Promise<UserLockResult> {
    if (!requestUser) {
      throw new InvalidParamsError("Invalid params.");
    }

    const graphAccessToken = await authenticateWitGraphAPI();
    let result: UserLockResult;

    try {
      result = await this.lockUser(requestUser, user, graphAccessToken);
    } catch (err) {
      result = {
        id: user,
        status: "ERROR",
        error: {
          code: err.constructor.name,
          message: err.message,
          data: err.data,
        },
      };
    }

    return result;
  }

  async lockUser(
    requestUser: RequestUser,
    userId: string,
    graphAccessToken?: string
  ): Promise<UserUpdateResult> {
    if (!requestUser || !userId) {
      throw new InvalidParamsError("Invalid params.");
    }

    if (requestUser.type !== UserType.ADMIN) {
      throw new InvalidUserRoleError(
        "User has no permissions to execute this operation"
      );
    }

    if (!graphAccessToken) {
      graphAccessToken = await authenticateWitGraphAPI();
    }

    const user = await getUserFromB2C(userId, graphAccessToken);
    if (!user) {
      throw new Error("Invalid user id.");
    }

    try {
      await this.connection.transaction(async (transaction) => {
        await transaction.update(
          User,
          { id: userId },
          {
            lockedAt: new Date(),
          }
        );
        return await this.userService.updateB2CUser(
          { accountEnabled: false },
          userId,
          graphAccessToken
        );
      });
    } catch {
      throw new Error("Error locking user at IdP");
    }

    return {
      id: userId,
      status: "OK",
    };
  }

  async unlockUsers(
    requestUser: RequestUser,
    users: string[]
  ): Promise<UserUnlockResult[]> {
    if (!requestUser || !users || users.length === 0) {
      throw new InvalidParamsError("Invalid params.");
    }

    const graphAccessToken = await authenticateWitGraphAPI();
    const results: UserUnlockResult[] = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      let result: UserUnlockResult;

      try {
        result = await this.unlockUser(requestUser, users[i], graphAccessToken);
      } catch (err) {
        result = {
          id: user,
          status: "ERROR",
          error: {
            code: err.constructor.name,
            message: err.message,
            data: err.data,
          },
        };
      }

      results.push(result);
    }

    return results;
  }

  async unlockUser(
    requestUser: RequestUser,
    userId: string,
    graphAccessToken?: string
  ): Promise<UserUpdateResult> {
    if (!requestUser || !userId) {
      throw new InvalidParamsError("Invalid params.");
    }

    if (requestUser.type !== UserType.ADMIN) {
      throw new InvalidUserRoleError(
        "User has no permissions to execute this operation"
      );
    }

    if (!graphAccessToken) {
      graphAccessToken = await authenticateWitGraphAPI();
    }

    const user = await getUserFromB2C(userId, graphAccessToken);
    if (!user) {
      throw new Error("Invalid user id.");
    }

    try {
      await this.connection.transaction(async (transaction) => {
        await transaction.update(
          User,
          { id: userId },
          {
            lockedAt: null,
          }
        );
        return await this.userService.updateB2CUser(
          { accountEnabled: true },
          userId,
          graphAccessToken
        );
      });
    } catch {
      throw new Error("Error locking user at IdP");
    }

    return {
      id: userId,
      status: "OK",
    };
  }

  async userLockValidation(userId: string): Promise<{ [key: string]: any }> {
    const userToBeRemoved = await this.userService.getUser(userId, {
      relations: [
        "userOrganisations",
        "userOrganisations.organisation",
        "userOrganisations.userOrganisationUnits",
        "userOrganisations.userOrganisationUnits.organisationUnit",
      ],
    });

    return await this.runUserValidation(userToBeRemoved);
  }

  async userChangeRoleValidation(
    userId: string
  ): Promise<{ [key: string]: any }> {
    const userToBeChanged = await this.userService.getUser(userId, {
      relations: [
        "userOrganisations",
        "userOrganisations.organisation",
        "userOrganisations.userOrganisationUnits",
        "userOrganisations.userOrganisationUnits.organisationUnit",
      ],
    });

    return await this.runUserChangeRoleValidation(userToBeChanged);
  }

  async createUser(
    requestUser: RequestUser,
    user: UserCreationModel
  ): Promise<UserCreationResult> {
    if (!requestUser || !user) {
      throw new InvalidParamsError("Invalid params.");
    }

    const graphAccessToken = await authenticateWitGraphAPI();

    let result: UserCreationResult;

    try {
      result = await this.userService.createUser(
        requestUser,
        user,
        graphAccessToken
      );
    } catch (err) {
      result = {
        id: null,
        status: "ERROR",
        error: {
          code: err.constructor.name,
          message: err.message,
          data: err.data,
        },
      };
    }

    return result;
  }

  async userExistsB2C(email: string): Promise<boolean> {
    const result = await this.userService.userExistsAtB2C(email);
    return result;
  }

  async acronymValidForOrganisationUpdate(
    acronym: string,
    organisationId: string
  ): Promise<boolean> {
    const result = await this.organisationService.acronymValidForOrganisationUpdate(
      acronym,
      organisationId
    );
    return result;
  }

  async updateUserRole(
    requestUser: RequestUser,
    userId: string,
    role: AccessorOrganisationRole,
    graphAccessToken?: string
  ): Promise<UserUpdateResult> {
    if (!requestUser || !userId || !role) {
      throw new InvalidParamsError("Invalid params.");
    }

    if (requestUser.type !== UserType.ADMIN) {
      throw new InvalidUserRoleError(
        "User has no permissions to execute this operation"
      );
    }

    if (!graphAccessToken) {
      graphAccessToken = await authenticateWitGraphAPI();
    }

    const user = await getUserFromB2C(userId, graphAccessToken);
    if (!user) {
      throw new Error("Invalid user id.");
    }

    const result = await this.userService.updateUserRole(
      requestUser,
      userId,
      role
    );

    return {
      id: userId,
      status: "OK",
    };
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

    const result = await this.organisationService.updateOrganisation(
      organisationId,
      name,
      acronym
    );

    return {
      id: organisationId,
      status: "OK",
    };
  }

  private async runUserValidation(user: User): Promise<{ [key: string]: any }> {
    const r = { ...rules };
    if (user.type === UserType.ASSESSMENT) {
      const checkAssessmentUser = await this.CheckAssessmentUser(user);
      if (r[checkAssessmentUser?.code.toString()]) {
        r[checkAssessmentUser?.code.toString()] = {
          ...checkAssessmentUser,
          valid: false,
        };
      }
    }

    if (user.type === UserType.ACCESSOR) {
      const accessorOrgRule = await this.CheckAccessorOrganisation(user);
      const accessorSupportRule = await this.checkAccessorSupports(user);

      if (r[accessorOrgRule?.code.toString()]) {
        r[accessorOrgRule?.code.toString()] = {
          ...accessorOrgRule,
          valid: false,
        };
      }

      if (r[accessorSupportRule?.code.toString()]) {
        r[accessorSupportRule?.code.toString()] = {
          ...accessorSupportRule,
          valid: false,
        };
      }
    }

    return r;
  }

  private async runUserChangeRoleValidation(
    user: User
  ): Promise<{ [key: string]: any }> {
    const userOrganisations = await user.userOrganisations;

    if (
      user.type === UserType.ACCESSOR &&
      userOrganisations[0].role === AccessorOrganisationRole.QUALIFYING_ACCESSOR
    ) {
      const r = { ...rule };
      const accessorOrgRule = await this.CheckAccessorOrganisationUnit(user);
      if (r[accessorOrgRule?.code.toString()]) {
        r[accessorOrgRule?.code.toString()] = {
          ...accessorOrgRule,
          valid: false,
        };
      }
      return r;
    }

    return [];
  }
  private async CheckAssessmentUser(
    userBeingRemoved: User
  ): Promise<UserLockValidationResult> {
    // Make sure the user is not the only Assessment User on the platform
    if (userBeingRemoved.type === UserType.ASSESSMENT) {
      const query = this.connection
        .createQueryBuilder(User, "usr")
        .where(`usr.type = :userType`, {
          userType: UserType.ASSESSMENT,
        })
        .andWhere(`usr.id != :userBeingRemoved`, {
          userBeingRemoved: userBeingRemoved.id,
        })
        .andWhere("usr.locked_at IS NULL");

      const assessmentUsersOnThePlatform = await query.getMany();

      if (assessmentUsersOnThePlatform.length === 0) {
        return {
          code: UserLockValidationCode.LastAssessmentUserOnPlatform,
        };
      }
    }
  }

  private async CheckAccessorOrganisationUnit(
    userToBeRemoved: User
  ): Promise<UserChangeRoleValidationResult> {
    const userOrganisations = await userToBeRemoved.userOrganisations;
    for (const userOrg of userOrganisations) {
      // Make sure it is also not the last User on the organisation units
      const userUnits = userOrg.userOrganisationUnits;
      for (const userUnit of userUnits) {
        const unitId = userUnit.organisationUnit.id;
        const unitMembers = await this.connection
          .createQueryBuilder(OrganisationUnitUser, "unitUser")
          .innerJoinAndSelect(
            "organisation_user",
            "orgUser",
            "unitUser.organisation_user_id = orgUser.id"
          )
          .where("unitUser.organisation_unit_id = :unitId", { unitId })
          .andWhere("orgUser.user_id != :userId", {
            userId: userToBeRemoved.id,
          })
          .andWhere("orgUser.role = :role", {
            role: AccessorOrganisationRole.QUALIFYING_ACCESSOR,
          })
          .getMany();

        if (unitMembers.length === 0) {
          return {
            code:
              UserChangeRoleValidationCode.LastAccessorUserOnOrganisationUnit,
            meta: {
              unit: {
                id: userUnit.organisationUnit.id,
                name: userUnit.organisationUnit.name,
              },
            },
          };
        }
      }
    }
  }

  private async CheckAccessorOrganisation(
    userToBeRemoved: User
  ): Promise<UserLockValidationResult> {
    const userOrganisations = await userToBeRemoved.userOrganisations;
    for (const userOrg of userOrganisations) {
      const organisationId = userOrg.organisation.id;
      const orgMembers = await this.connection
        .createQueryBuilder(OrganisationUser, "orgUser")
        .innerJoin(
          "user",
          "usr",
          "orgUser.user_id = usr.id and usr.locked_at IS NULL"
        )
        .where("orgUser.organisation_id = :organisationId", {
          organisationId,
        })
        .andWhere("orgUser.user_id != :userId", { userId: userToBeRemoved.id })
        .andWhere("orgUser.role = :role", {
          role: AccessorOrganisationRole.QUALIFYING_ACCESSOR,
        })
        .getMany();

      if (orgMembers.length === 0) {
        return {
          code: UserLockValidationCode.LastAccessorUserOnOrganisation,
          meta: {
            organisation: {
              id: userOrg.organisation.id,
              name: userOrg.organisation.name,
            },
          },
        };
      }

      // Make sure it is also not the last User on the organisation units
      const userUnits = userOrg.userOrganisationUnits;
      for (const userUnit of userUnits) {
        const unitId = userUnit.organisationUnit.id;
        const unitMembers = await this.connection
          .createQueryBuilder(OrganisationUnitUser, "unitUser")
          .innerJoinAndSelect(
            "organisation_user",
            "orgUser",
            "unitUser.organisation_user_id = orgUser.id"
          )
          .where("unitUser.organisation_unit_id = :unitId", { unitId })
          .andWhere("orgUser.user_id != :userId", {
            userId: userToBeRemoved.id,
          })
          .andWhere("orgUser.role = :role", {
            role: AccessorOrganisationRole.QUALIFYING_ACCESSOR,
          })
          .getMany();

        if (unitMembers.length === 0) {
          return {
            code: UserLockValidationCode.LastAccessorUserOnOrganisationUnit,
            meta: {
              unit: {
                id: userUnit.organisationUnit.id,
                name: userUnit.organisationUnit.name,
              },
            },
          };
        }
      }
    }
  }

  private async checkAccessorSupports(
    userToBeRemoved: User
  ): Promise<UserLockValidationResult> {
    const query = this.connection
      .createQueryBuilder(Innovation, "innovations")
      .select("innovations.id", "innovationId")
      .addSelect("innovations.name", "innovationName")
      .addSelect("unit.id", "unitId")
      .addSelect("unit.name", "unitName")
      .innerJoin(
        "innovation_support",
        "supports",
        "innovations.id = supports.innovation_id"
      )
      .innerJoin(
        "innovation_support_user",
        "userSupport",
        "supports.id = userSupport.innovation_support_id"
      )
      .innerJoin(
        "organisation_unit_user",
        "unitUsers",
        "userSupport.organisation_unit_user_id = unitUsers.id"
      )
      .innerJoin(
        "organisation_unit",
        "unit",
        "unit.id = unitUsers.organisation_unit_id"
      )
      .innerJoin(
        "organisation_user",
        "organisationUser",
        "organisationUser.id = unitUsers.organisation_user_id"
      )
      .innerJoin(
        "user",
        "usr",
        "organisationUser.user_id = usr.id and usr.locked_at IS NULL"
      )
      .where("organisationUser.user_id = :userId", {
        userId: userToBeRemoved.id,
      })
      .andWhere("supports.status = :status", {
        status: InnovationSupportStatus.ENGAGING,
      })
      .andWhere(
        `NOT EXISTS(
        SELECT 1 FROM innovation_support s
        INNER JOIN innovation_support_user u on s.id = u.innovation_support_id
        INNER JOIN organisation_unit_user ous on ous.id = u.organisation_unit_user_id
        INNER JOIN organisation_user ou on ou.id = ous.organisation_user_id
        WHERE s.id = supports.id and ou.user_id != :userId and s.deleted_at IS NULL
      )`,
        {
          userId: userToBeRemoved.id,
        }
      );
    const innovations = await query.getRawMany();

    if (innovations.length > 0) {
      return {
        code: UserLockValidationCode.LastAccessorFromUnitProvidingSupport,
        meta: {
          supports: { count: innovations.length, innovations },
        },
      };
    }
  }
}
