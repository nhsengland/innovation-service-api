import {
  AccessorOrganisationRole,
  Innovation,
  InnovationStatus,
  InnovationSupport,
  InnovationSupportStatus,
  Organisation,
  OrganisationUnit,
  OrganisationUnitUser,
  OrganisationUser,
  User,
  UserType,
} from "@domain/index";
import {
  InvalidDataError,
  InvalidParamsError,
  InvalidUserRoleError,
  InvalidUserTypeError,
  LastAccessorFromUnitProvidingSupportError,
  LastAccessorUserOnOrganisationError,
  LastAccessorUserOnOrganisationUnitError,
  LastAssessmentUserOnPlatformError,
} from "@services/errors";
import {
  ProfileSlimModel,
  UserEmailModel,
} from "@services/models/ProfileSlimModel";
import { RequestUser } from "@services/models/RequestUser";
import { UserCreationModel } from "@services/models/UserCreationModel";
import { UserCreationResult } from "@services/models/UserCreationResult";
import {
  UserLockResult,
  UserUnlockResult,
} from "@services/models/UserLockResult";
import { UserProfileUpdateModel } from "@services/models/UserProfileUpdateModel";
import { UserUpdateModel } from "@services/models/UserUpdateModel";
import { UserUpdateResult } from "@services/models/UserUpdateResult";
import { UserSearchResult } from "@services/types";
import {
  Connection,
  EntityManager,
  FindOneOptions,
  getConnection,
  getRepository,
  IsNull,
  Repository,
} from "typeorm";
import {
  authenticateWitGraphAPI,
  createB2CUser,
  deleteB2CAccount,
  getUserFromB2C,
  getUserFromB2CByEmail,
  getUsersFromB2C,
  saveB2CUser,
} from "../helpers";
import { ProfileModel } from "../models/ProfileModel";

export class UserService {
  private readonly connection: Connection;
  private readonly userRepo: Repository<User>;
  private readonly orgRepo: Repository<Organisation>;
  private readonly orgUnitRepo: Repository<OrganisationUnit>;
  private readonly orgUserRepo: Repository<OrganisationUser>;
  private readonly orgUnitUserRepo: Repository<OrganisationUnitUser>;
  private readonly innovationRepo: Repository<Innovation>;
  private readonly innovationSupportRepo: Repository<InnovationSupport>;

  constructor(connectionName?: string) {
    this.connection = getConnection(connectionName);
    this.userRepo = getRepository(User, connectionName);
    this.orgRepo = getRepository(Organisation, connectionName);
    this.orgUnitRepo = getRepository(OrganisationUnit, connectionName);
    this.orgUserRepo = getRepository(OrganisationUser, connectionName);
    this.orgUnitUserRepo = getRepository(OrganisationUnitUser, connectionName);
    this.innovationRepo = getRepository(Innovation, connectionName);
    this.innovationSupportRepo = getRepository(
      InnovationSupport,
      connectionName
    );
  }

  async find(id: string, options?: FindOneOptions) {
    if (!id) return;
    return await this.userRepo.findOne(id, options);
  }

  async create(user: User) {
    return await this.userRepo.save(user);
  }

  async getUser(id: string, options?: FindOneOptions<User>) {
    return await this.userRepo.findOne(id, options);
  }

  async updateB2CUser(
    payload: any,
    oid: string,
    accessToken?: string
  ): Promise<boolean> {
    if (!accessToken) {
      accessToken = await authenticateWitGraphAPI();
    }
    await saveB2CUser(accessToken, oid, payload);

    return true;
  }

  async deleteAccount(requestUser: RequestUser): Promise<boolean> {
    const graphAccessToken = await authenticateWitGraphAPI();

    if (!graphAccessToken) {
      throw new Error("Invalid Credentials");
    }

    const user = await getUserFromB2C(requestUser.id, graphAccessToken);

    if (!user) {
      throw new Error("Invalid user id.");
    }

    try {
      await deleteB2CAccount(requestUser.id);
    } catch {
      throw new Error("Error updating user.");
    }

    return true;
  }

  async getProfile(id: string, accessToken?: string): Promise<ProfileModel> {
    if (!accessToken) {
      accessToken = await authenticateWitGraphAPI();
    }

    const user = await getUserFromB2C(id, accessToken);

    if (!user) {
      throw new Error("Invalid user.");
    }

    const email = user.identities.find(
      (identity) => identity.signInType === "emailAddress"
    ).issuerAssignedId;

    const profile: ProfileModel = {
      id,
      displayName: user.displayName,
      type: null,
      organisations: [],
      email,
      phone: user.mobilePhone,
      passwordResetOn:
        user[`extension_${process.env.AD_EXTENSION_ID}_passwordResetOn`],
    };

    try {
      const userDb: User = await this.userRepo.findOne(id, {
        relations: [
          "userOrganisations",
          "userOrganisations.organisation",
          "userOrganisations.userOrganisationUnits",
          "userOrganisations.userOrganisationUnits.organisationUnit",
        ],
      });
      if (userDb) {
        const organisations: OrganisationUser[] = await userDb.userOrganisations;

        profile.type = userDb.type;
        profile.organisations = [];

        for (let idx = 0; idx < organisations.length; idx++) {
          const orgUser: OrganisationUser = organisations[idx];
          const org: Organisation = orgUser.organisation;
          const orgUnits: OrganisationUnitUser[] =
            orgUser.userOrganisationUnits;

          profile.organisations.push({
            id: org.id,
            name: org.name,
            size: org.size,
            role: orgUser.role,
            isShadow: org.isShadow,
            organisationUnits: orgUnits?.map((ouu: OrganisationUnitUser) => ({
              id: ouu.organisationUnit.id,
              name: ouu.organisationUnit.name,
            })),
          });
        }
      }
    } catch (error) {
      throw error;
    }

    return profile;
  }

  async searchUsersByEmail(
    requestUser: RequestUser,
    emails: string[]
  ): Promise<UserSearchResult[]> {
    if (!requestUser || !emails || emails.length === 0) {
      throw new InvalidParamsError("Invalid params.");
    }
    const retVal: UserSearchResult[] = [];

    for (const email of emails) {
      const result = await this.searchUserByEmail(email);
      if (result) {
        retVal.push(result);
      }
    }

    return retVal;
  }

  async searchUserByEmail(email: string): Promise<UserSearchResult> {
    const accessToken = await authenticateWitGraphAPI();
    const userB2C = await getUserFromB2CByEmail(email, accessToken);

    const user = await this.find(userB2C.id, {
      relations: [
        "userOrganisations",
        "userOrganisations.organisation",
        "userOrganisations.userOrganisationUnits",
        "userOrganisations.userOrganisationUnits.innovationSupports",
        "userOrganisations.userOrganisationUnits.innovationSupports.innovation",
        "userOrganisations.userOrganisationUnits.organisationUnit",
      ],
    });

    const userOrgs = await user.userOrganisations;

    const userOrganisations = [];

    for (const userOrg of userOrgs) {
      const userUnits = userOrg.userOrganisationUnits;

      const unitsSlim = [];
      for (const unit of userUnits) {
        unitsSlim.push({
          id: unit.organisationUnit.id,
          name: unit.organisationUnit.name,
          supportCount: unit.innovationSupports.length,
        });
      }

      userOrganisations.push({
        id: userOrg.organisation.id,
        name: userOrg.organisation.name,
        role: userOrg.role,
        units: unitsSlim,
      });
    }

    if (userB2C && user) {
      return {
        id: userB2C.id,
        displayName: userB2C.displayName,
        userOrganisations,
      };
    }

    return null;
  }

  async getUsersEmail(ids: string[]): Promise<UserEmailModel[]> {
    if (ids.length === 0) {
      return null;
    }
    const accessToken = await authenticateWitGraphAPI();
    const uniqueUserIds = ids.filter((x, i, a) => a.indexOf(x) == i);
    const userIds = uniqueUserIds.map((u) => `"${u}"`).join(",");
    const odataFilter = `$filter=id in (${userIds})`;

    const users =
      (await getUsersFromB2C(accessToken, odataFilter, "beta", true)) || [];

    const result = users.map((u) => ({
      id: u.id,
      displayName: u.displayName,
      email: u.identities.find((i) => i.signInType === "emailAddress")
        ?.issuerAssignedId,
    }));

    return result;
  }

  async getListOfUsers(
    ids: string[],
    excludeLocked?: boolean
  ): Promise<ProfileSlimModel[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    const accessToken = await authenticateWitGraphAPI();

    // remove duplicated userIds
    const uniqueUserIds = ids.filter((x, i, a) => a.indexOf(x) == i);

    // limit of users per chunk
    const userIdsChunkSize = 10;

    // create chunks
    const userIdsChunks = uniqueUserIds.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / userIdsChunkSize);

      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = [];
      }

      resultArray[chunkIndex].push(item);

      return resultArray;
    }, []);

    // prepare promises
    const promises = [];
    for (let i = 0; i < userIdsChunks.length; i++) {
      const userIds = userIdsChunks[i].map((u) => `"${u}"`).join(",");
      const odataFilter = `$filter=id in (${userIds})`;

      promises.push(
        getUsersFromB2C(accessToken, odataFilter, undefined, excludeLocked)
      );
    }

    // promise all and merge all results
    return Promise.all(promises).then((results) => {
      return results.flatMap((result) =>
        result?.map((u) => ({
          id: u.id,
          displayName: u.displayName,
        }))
      );
    });
  }

  async updateProfile(requestUser: RequestUser, user: UserProfileUpdateModel) {
    if (!requestUser || !user) {
      throw new InvalidParamsError("Invalid params.");
    }

    const accessToken = await authenticateWitGraphAPI();
    const currentProfile = await this.getProfile(requestUser.id, accessToken);
    if (
      user.displayName !== currentProfile.displayName ||
      user.mobilePhone !== currentProfile.phone
    ) {
      await this.updateB2CUser(
        { displayName: user.displayName, mobilePhone: user.mobilePhone },
        requestUser.id,
        accessToken
      );
    }

    if (user.organisation) {
      const organisationId = user.organisation.id;
      delete user.organisation.id;
      await this.orgRepo.update(organisationId, user.organisation);
    }

    return { id: requestUser.id };
  }

  async createUsers(
    requestUser: RequestUser,
    users: UserCreationModel[]
  ): Promise<UserCreationResult[]> {
    if (!requestUser || !users || users.length === 0) {
      throw new InvalidParamsError("Invalid params.");
    }

    const graphAccessToken = await authenticateWitGraphAPI();
    const results: UserCreationResult[] = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      let result: UserCreationResult;

      try {
        result = await this.createUser(requestUser, users[i], graphAccessToken);
      } catch (err) {
        result = {
          email: user.email,
          error: {
            code: err.constructor.name,
            message: err.message,
          },
        };
      }

      results.push(result);
    }

    return results;
  }

  async createUser(
    requestUser: RequestUser,
    userModel: UserCreationModel,
    graphAccessToken?: string
  ): Promise<UserCreationResult> {
    if (!requestUser || !userModel) {
      throw new InvalidParamsError("Invalid params.");
    }

    if (
      userModel.type === UserType.ACCESSOR &&
      (!userModel.organisationAcronym ||
        !userModel.organisationUnitAcronym ||
        !userModel.role)
    ) {
      throw new InvalidParamsError("Invalid params. Invalid accessor params.");
    }

    if (
      userModel.type !== UserType.ACCESSOR &&
      userModel.type !== UserType.ASSESSMENT
    ) {
      throw new InvalidDataError("Invalid data. Invalid user type.");
    }

    if (requestUser.type !== UserType.ADMIN) {
      throw new InvalidUserTypeError("Invalid user type.");
    }

    if (!graphAccessToken) {
      graphAccessToken = await authenticateWitGraphAPI();
    }

    if (!userModel.password) {
      userModel.password = Math.random().toString(36).slice(2) + "0aA!";
    }

    let oid: string;
    let user: User;
    // Check if user exists in B2C
    const b2cUser = await getUserFromB2CByEmail(
      userModel.email,
      graphAccessToken
    );

    if (b2cUser) {
      oid = b2cUser.id;

      // If user exists in B2C, check if exists in the DB
      user = await this.userRepo
        .createQueryBuilder("user")
        .where("id = :oid", {
          oid,
        })
        .getOne();

      if (user && user.type !== userModel.type) {
        throw new InvalidDataError("Invalid data. Invalid user type.");
      }
    } else {
      // If the user does not exist in the B2C, create b2c user
      const b2cUser = await createB2CUser(
        graphAccessToken,
        userModel.name,
        userModel.email,
        userModel.password
      );

      oid = b2cUser.id;
    }

    let organisation: Organisation = null;
    if (userModel.organisationAcronym) {
      organisation = await this.orgRepo
        .createQueryBuilder("organisation")
        .where("acronym = :acronym", {
          acronym: userModel.organisationAcronym,
        })
        .getOne();
    }

    let organisationUnit: OrganisationUnit = null;
    if (userModel.organisationUnitAcronym) {
      organisationUnit = await this.orgUnitRepo
        .createQueryBuilder("organisationUnit")
        .where("acronym = :acronym", {
          acronym: userModel.organisationUnitAcronym,
        })
        .getOne();
    }

    const result: UserCreationResult = {
      email: userModel.email,
      userId: oid,
    };
    return await this.connection.transaction(
      async (transactionManager: EntityManager) => {
        if (!user) {
          // If the user does not exist in the DB, create user
          user = User.new({
            id: oid,
            type: userModel.type,
            createdBy: requestUser.id,
            updatedBy: requestUser.id,
          });
          await transactionManager.save(User, user);
        }

        if (organisation) {
          const orgUserObj = OrganisationUser.new({
            organisation,
            user,
            role: userModel.role,
            createdBy: requestUser.id,
            updatedBy: requestUser.id,
          });

          const orgUser = await transactionManager.save(
            OrganisationUser,
            orgUserObj
          );
          result.organisationUserId = orgUser.id;

          if (organisationUnit) {
            const orgUnitUserObj = OrganisationUnitUser.new({
              organisationUnit: { id: organisationUnit.id },
              organisationUser: { id: orgUser.id },
              createdBy: requestUser.id,
              updatedBy: requestUser.id,
            });

            const orgUnitUser = await transactionManager.save(
              OrganisationUnitUser,
              orgUnitUserObj
            );
            result.organisationUnitUserId = orgUnitUser.id;
          }
        }

        return result;
      }
    );
  }

  async updateUsers(
    requestUser: RequestUser,
    users: UserUpdateModel[]
  ): Promise<UserUpdateResult[]> {
    if (!requestUser || !users || users.length === 0) {
      throw new InvalidParamsError("Invalid params.");
    }

    const graphAccessToken = await authenticateWitGraphAPI();
    const results: UserUpdateResult[] = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      let result: UserUpdateResult;

      try {
        result = await this.updateUser(requestUser, users[i], graphAccessToken);
      } catch (err) {
        result = {
          id: user.id,
          status: "ERROR",
          error: {
            code: err.constructor.name,
            message: err.message,
          },
        };
      }

      results.push(result);
    }

    return results;
  }

  async updateUser(
    requestUser: RequestUser,
    userModel: UserUpdateModel,
    graphAccessToken?: string
  ): Promise<UserUpdateResult> {
    if (!requestUser || !userModel) {
      throw new InvalidParamsError("Invalid params.");
    }

    if (!graphAccessToken) {
      graphAccessToken = await authenticateWitGraphAPI();
    }

    const user = await getUserFromB2C(userModel.id, graphAccessToken);
    if (!user) {
      throw new Error("Invalid user id.");
    }

    try {
      await this.updateB2CUser(
        userModel.properties,
        userModel.id,
        graphAccessToken
      );
    } catch {
      throw new Error("Error updating user.");
    }

    return {
      id: userModel.id,
      status: "OK",
    };
  }

  async getUsersOfType(type: UserType): Promise<User[]> {
    const users = await this.userRepo.find({
      where: {
        type: UserType.ASSESSMENT,
      },
    });

    return users;
  }

  async lockUsers(
    requestUser: RequestUser,
    users: string[]
  ): Promise<UserLockResult[]> {
    if (!requestUser || !users || users.length === 0) {
      throw new InvalidParamsError("Invalid params.");
    }

    const graphAccessToken = await authenticateWitGraphAPI();
    const results: UserLockResult[] = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      let result: UserLockResult;

      try {
        result = await this.lockUser(requestUser, users[i], graphAccessToken);
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

    const userToBeRemoved = await this.getUser(userId, {
      relations: [
        "userOrganisations",
        "userOrganisations.organisation",
        "userOrganisations.userOrganisationUnits",
        "userOrganisations.userOrganisationUnits.organisationUnit",
      ],
    });

    try {
      await this.CheckAssessmentUser(userToBeRemoved);

      // Make sure the user is not the last user on the Organisation
      if (userToBeRemoved.type === UserType.ACCESSOR) {
        // Make sure it is not the last user providing support on an innovation
        await this.CheckAccessorOrganisation(userToBeRemoved);

        // Get all Innovations which the user is providing support to.
        await this.checkAccessorSupports(userToBeRemoved);
      }
    } catch (error) {
      throw error;
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
        return await this.updateB2CUser(
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
        return await this.updateB2CUser(
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

  private async CheckAssessmentUser(userBeingRemoved: User) {
    // Make sure the user is not the only Assessment User on the platform
    if (userBeingRemoved.type === UserType.ASSESSMENT) {
      const query = this.userRepo
        .createQueryBuilder("usr")
        .where(`usr.type = :userType`, {
          userType: UserType.ASSESSMENT,
        })
        .andWhere(`usr.id != :userBeingRemoved`, {
          userBeingRemoved: userBeingRemoved.id,
        })
        .andWhere("usr.locked_at IS NULL");

      const assessmentUsersOnThePlatform = await query.getMany();

      if (assessmentUsersOnThePlatform.length === 0) {
        throw new LastAssessmentUserOnPlatformError(
          `The user with id ${userBeingRemoved.id} is the last Assessment User on the platform. You cannot lock this account`
        );
      }
    }
  }

  private async CheckAccessorOrganisation(userToBeRemoved: User) {
    const userOrganisations = await userToBeRemoved.userOrganisations;
    for (const userOrg of userOrganisations) {
      const organisationId = userOrg.organisation.id;
      const orgMembers = await this.orgUserRepo
        .createQueryBuilder("orgUser")
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
        throw new LastAccessorUserOnOrganisationError(
          `The user with id ${userToBeRemoved.id} is the last Qualifying Accessor User on the Organisation ${userOrg.organisation.name}(${organisationId}). You cannot lock this account`
        );
      }

      // Make sure it is also not the last User on the organisation units
      const userUnits = userOrg.userOrganisationUnits;
      for (const userUnit of userUnits) {
        const unitId = userUnit.organisationUnit.id;
        const unitMembers = await this.orgUnitUserRepo
          .createQueryBuilder("unitUser")
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
          throw new LastAccessorUserOnOrganisationUnitError(
            `The user with id ${userToBeRemoved.id} is the last Qualifying Accessor User on the Organisation Unit ${userUnit.organisationUnit.name}(${unitId}). You cannot lock this account`
          );
        }
      }
    }
  }

  private async checkAccessorSupports(userToBeRemoved: User) {
    const query = this.innovationRepo
      .createQueryBuilder("innovations")
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
      throw new LastAccessorFromUnitProvidingSupportError(
        `The user with id ${userToBeRemoved.id} is the last Accessor User from his unit providing support to ${innovations.length} innovation(s). You cannot lock this account.
        Check the data property of this error for more information.
        `,
        innovations
      );
    }
  }
}
