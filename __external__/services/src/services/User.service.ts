import {
  AccessorOrganisationRole,
  Innovation,
  Organisation,
  OrganisationUnit,
  OrganisationUnitUser,
  OrganisationUser,
  User,
  UserType,
  Role,
  ServiceRole,
  UserRole,
} from "@domain/index";
import {
  InvalidDataError,
  InvalidParamsError,
  InvalidUserTypeError,
} from "@services/errors";
import {
  ProfileSlimModel,
  UserEmailModel,
} from "@services/models/ProfileSlimModel";
import { RequestUser } from "@services/models/RequestUser";
import { SimpleResult } from "@services/models/SimpleResult";
import { UserCreationModel } from "@services/models/UserCreationModel";
import { UserCreationResult } from "@services/models/UserCreationResult";
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
  Repository,
} from "typeorm";
import { NotFound } from "utils/responsify";
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
  private readonly innovationRepo: Repository<Innovation>;
  private readonly roleRepo: Repository<Role>;

  constructor(connectionName?: string) {
    this.connection = getConnection(connectionName);
    this.userRepo = getRepository(User, connectionName);
    this.orgRepo = getRepository(Organisation, connectionName);
    this.orgUnitRepo = getRepository(OrganisationUnit, connectionName);
    this.innovationRepo = getRepository(Innovation, connectionName);
    this.roleRepo = getRepository(Role, connectionName);
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

  async getUserDetails(
    id: string,
    model: "MINIMAL" | "FULL" = "MINIMAL"
  ): Promise<any> {
    const accessToken = await authenticateWitGraphAPI();

    const userB2C = await getUserFromB2C(id, accessToken);

    if (!userB2C) return null;

    if (model === "MINIMAL") {
      return {
        id: userB2C.id,
        displayName: userB2C.displayName,
      };
    }

    const user = await this.find(id, {
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
          supportCount: unit.innovationSupports?.length,
        });
      }

      userOrganisations.push({
        id: userOrg.organisation.id,
        name: userOrg.organisation.name,
        size: userOrg.organisation.size,
        isShadow: userOrg.organisation.isShadow,
        role: userOrg.role,
        units: unitsSlim,
      });
    }

    let innovations: SimpleResult[] = null;
    if (user.type === UserType.INNOVATOR) {
      const innovationList = await this.innovationRepo
        .createQueryBuilder("innovation")
        .where("owner_id = :userId", {
          userId: id,
        })
        .getMany();

      innovations = innovationList?.map((innovation) => ({
        id: innovation.id,
        name: innovation.name,
      }));
    }

    if (userB2C && user) {
      return {
        id: userB2C.id,
        displayName: userB2C.displayName,
        phone: userB2C.mobilePhone,
        email: userB2C.identities.find((i) => i.signInType === "emailAddress")
          ?.issuerAssignedId,
        type: user.type,
        lockedAt: user.lockedAt,
        userOrganisations,
        innovations,
      };
    }

    return null;
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
          "serviceRoles",
          "serviceRoles.role",
        ],
      });
      if (userDb) {
        const organisations: OrganisationUser[] = await userDb.userOrganisations;

        profile.type = userDb.type;
        profile.roles = userDb.serviceRoles?.map((sr) => sr.role.name) || [];
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
    const userB2C = await getUserFromB2CByEmail(email, accessToken, "beta");

    if (!userB2C) return null;

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
        email: userB2C.identities.find((i) => i.signInType === "emailAddress")
          ?.issuerAssignedId,
        type: user.type,
        lockedAt: user.lockedAt,
        userOrganisations,
      };
    }

    return null;
  }

  async userExistsAtB2C(email: string): Promise<boolean> {
    const accessToken = await authenticateWitGraphAPI();
    const userB2C = await getUserFromB2CByEmail(email, accessToken);

    if (userB2C) {
      return true;
    }

    return false;
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
    excludeLocked?: boolean,
    includeEmail?: boolean
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
    if (includeEmail) {
      return Promise.all(promises).then((results) => {
        return results.flatMap((result) =>
          result?.map((u) => ({
            id: u.id,
            displayName: u.displayName,
            email: u.identities.find((i) => i.signInType === "emailAddress")
              ?.issuerAssignedId,
          }))
        );
      });
    } else {
      return Promise.all(promises).then((results) => {
        return results.flatMap((result) =>
          result?.map((u) => ({
            id: u.id,
            displayName: u.displayName,
          }))
        );
      });
    }
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
          id: null,
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

  async createUser(
    requestUser: RequestUser,
    userModel: UserCreationModel,
    graphAccessToken?: string
  ): Promise<UserCreationResult> {
    if (!requestUser || !userModel) {
      throw new InvalidParamsError("Invalid params.");
    }

    // UserType Accessor should have the role and organisation provided in request
    if (
      userModel.type === UserType.ACCESSOR &&
      (!userModel.role ||
        !userModel.organisationAcronym ||
        !userModel.organisationUnitAcronym)
    ) {
      throw new InvalidParamsError("Invalid params. Invalid accessor params.");
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

    let organisation: Organisation = null;
    if (userModel.organisationAcronym) {
      organisation = await this.orgRepo
        .createQueryBuilder("organisation")
        .where("acronym = :acronym", {
          acronym: userModel.organisationAcronym,
        })
        .getOne();

      if (!organisation) {
        throw new InvalidParamsError("Invalid params. Invalid organisation.");
      }
    }

    let organisationUnit: OrganisationUnit = null;
    if (userModel.organisationUnitAcronym) {
      organisationUnit = await this.orgUnitRepo
        .createQueryBuilder("organisationUnit")
        .where("acronym = :acronym", {
          acronym: userModel.organisationUnitAcronym,
        })
        .getOne();

      if (!organisationUnit) {
        throw new InvalidParamsError(
          "Invalid params. Invalid organisation unit."
        );
      }
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

      if (user) {
        throw new InvalidDataError("Invalid data. User already exists.");
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

        //Check if the user being created is an ADMIN, if it is, create a new UserRole with the User and Role IDs
        if (user.type == "ADMIN") {
          const role = await this.roleRepo.findOne({
            where: {
              name: ServiceRole.ADMIN,
            },
          });

          await transactionManager.save(UserRole, {
            user: user,
            role: role,
          });
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
          }
        }

        const result: UserCreationResult = {
          id: oid,
          status: "OK",
        };

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

  async getUsersOfTypePaged(
    type: UserType,
    skip = 0,
    take = 10
  ): Promise<User[]> {
    const users = await this.userRepo.find({
      relations: [
        "userOrganisations",
        "userOrganisations.organisation",
        "userOrganisations.userOrganisationUnits",
        "userOrganisations.userOrganisationUnits.organisationUnit",
        "serviceRoles",
        "serviceRoles.role",
      ],
      where: {
        type,
      },
      skip,
      take,
    });

    return users;
  }

  async updateUserRole(
    requestUser: RequestUser,
    userId: string,
    role: AccessorOrganisationRole
  ) {
    if (!userId || !requestUser || !role) {
      throw new InvalidParamsError(
        "Invalid parameters. You must define the id and the request user."
      );
    }

    const user = await this.find(userId, {
      relations: ["userOrganisations"],
    });

    if (!user) {
      throw new InvalidDataError("User was not found.");
    }

    const userOrgs = await user.userOrganisations;

    try {
      await this.connection.transaction(async (trs) => {
        const updatedRole = await trs.update(
          OrganisationUser,
          { id: userOrgs[0].id },
          {
            role: role,
          }
        );
      });
    } catch {
      throw new Error("Error updating user.");
    }
  }
}
