import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import {
  NotifContextDetail,
  NotifContextType,
} from "@domain/enums/notification.enums";
import {
  AccessorOrganisationRole,
  Innovation,
  InnovationSupportStatus,
  NotificationAudience,
  NotificationContextType,
  Organisation,
  OrganisationUnit,
  OrganisationUnitUser,
  OrganisationUser,
  User,
  UserType,
} from "@domain/index";
import { QueueMessageEnum } from "@services/enums/queue.enum";
import { InvalidParamsError, InvalidUserRoleError } from "@services/errors";
import { AdminDeletionResult } from "@services/models/AdminDeletionResult";
import { ProfileSlimModel } from "@services/models/ProfileSlimModel";
import { RequestUser } from "@services/models/RequestUser";
import { UserChangeRoleValidationResult } from "@services/models/UserChangeRoleValidationResult";
import { UserCreationModel } from "@services/models/UserCreationModel";
import { UserCreationResult } from "@services/models/UserCreationResult";
import { UserLockResult } from "@services/models/UserLockResult";
import { UserLockValidationResult } from "@services/models/UserLockValidationResult";
import { UserUpdateResult } from "@services/models/UserUpdateResult";
import {
  UserChangeRoleValidationCode,
  UserLockValidationCode,
  UserSearchResult,
} from "@services/types";
import {
  Connection,
  EntityManager,
  getConnection,
  In,
  UpdateResult,
} from "typeorm";
import { v4 as uuid } from "uuid";
import { UserService } from "..";
import * as accessorRules from "../config/admin-accessor-user-lock.config.json";
import * as rule from "../config/admin-change-role.config.json";
import * as assessmentRules from "../config/admin-needs-assessment-user-lock.config.json";
import * as qaRules from "../config/admin-qa-user-lock.config.json";
import * as unitrules from "../config/admin-user-change-unit.config.json";
import {
  authenticateWitGraphAPI,
  deleteB2CAccount,
  getUserFromB2C,
} from "../helpers";
import { InnovationSupportService } from "./InnovationSupport.service";
import { LoggerService } from "./Logger.service";
import { NotificationService } from "./Notification.service";
import { OrganisationService } from "./Organisation.service";
import { QueueService } from "./Queue.service";

export class AdminService {
  private readonly connection: Connection;
  private readonly userService: UserService;
  private readonly notificationService: NotificationService;
  private readonly logService: LoggerService;
  private readonly innovationSupportService: InnovationSupportService;
  private readonly organisationService: OrganisationService;
  private readonly queueService: QueueService;

  constructor(connectionName?: string) {
    this.connection = getConnection(connectionName);
    this.userService = new UserService(connectionName);
    this.notificationService = new NotificationService(connectionName);
    this.innovationSupportService = new InnovationSupportService(
      connectionName
    );
    this.organisationService = new OrganisationService(connectionName);
    this.queueService = new QueueService();
  }
  async getUsersOfType(
    type: UserType,
    skip = 0,
    take = 10
  ): Promise<UserSearchResult[]> {
    const users = await this.userService.getUsersOfTypePaged(type, skip, take);
    const b2cUsers = await this.userService.getListOfUsers(
      users.map((u) => u.externalId),
      false
    );

    const result: UserSearchResult[] = [];

    for (const user of users) {
      const b2c = b2cUsers.find((u) => u.id === user.externalId);
      const userOrganisations = await user.userOrganisations;
      if (b2c) {
        result.push({
          id: user.id,
          externalId: b2c.id,
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
    user: string,
    trs?: EntityManager,
    ignoreNotifications?: boolean
  ): Promise<UserLockResult> {
    if (!requestUser) {
      throw new InvalidParamsError("Invalid params.");
    }

    const graphAccessToken = await authenticateWitGraphAPI();
    let result: UserLockResult;

    try {
      if (!ignoreNotifications) {
        result = await this.lockUser(requestUser, user, graphAccessToken, trs);
      } else {
        result = await this.lockUserNoNotifications(
          requestUser,
          user,
          graphAccessToken,
          trs
        );
      }
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
  private getUserEmail(b2cUser: any) {
    return b2cUser.identities.find(
      (identity: any) => identity.signInType === "emailAddress"
    ).issuerAssignedId;
  }
  async lockUser(
    requestUser: RequestUser,
    externalId: string,
    graphAccessToken?: string,
    transaction?: EntityManager
  ): Promise<UserUpdateResult> {
    if (!requestUser || !externalId) {
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

    const user = await getUserFromB2C(externalId, graphAccessToken);
    if (!user) {
      throw new Error("Invalid user id.");
    }

    let result;
    try {
      if (!transaction) {
        result = await this.connection.transaction(async (trs) => {
          return await this.lockUserTransaction(
            trs,
            externalId,
            graphAccessToken
          );
        });
      } else {
        result = await this.lockUserTransaction(
          transaction,
          externalId,
          graphAccessToken
        );
      }
    } catch {
      throw new Error("Error locking user at IdP");
    }

    //When the user is locked, trigger an inservice notification for Qualifying Accessors if the innovation support status is "further info",
    //"waiting" or "engaging" and for Accessors when the status = "engaging".
    const userDetails = await this.userService.getUserDetails(
      externalId,
      "FULL"
    );
    if (userDetails.type === "INNOVATOR") {
      let users: ProfileSlimModel[];
      const orgUnitUsersList: string[] = [];
      const userToRequestUser: RequestUser = {
        id: userDetails.id,
        externalId: userDetails.externalId,
        type: UserType.INNOVATOR,
      };

      for (
        let innovationIdx = 0;
        innovationIdx < userDetails.innovations.length;
        innovationIdx++
      ) {
        const innovationSupports = await this.innovationSupportService.findAllByInnovation(
          userToRequestUser,
          userDetails.innovations[innovationIdx].id
        );

        for (
          let innovationSupportIdx = 0;
          innovationSupportIdx < innovationSupports.length;
          innovationSupportIdx++
        ) {
          const organisationUnitUsers = await this.organisationService.findOrganisationUnitUsersById(
            innovationSupports[innovationSupportIdx].organisationUnit.id
          );

          for (
            let organisationUnitUserIdx = 0;
            organisationUnitUserIdx < organisationUnitUsers.length;
            organisationUnitUserIdx++
          ) {
            if (
              innovationSupports[innovationSupportIdx].status ===
                InnovationSupportStatus.FURTHER_INFO_REQUIRED ||
              innovationSupports[innovationSupportIdx].status ===
                InnovationSupportStatus.WAITING
            ) {
              if (
                organisationUnitUsers[organisationUnitUserIdx].role ===
                "QUALIFYING_ACCESSOR"
              ) {
                orgUnitUsersList.push(
                  organisationUnitUsers[organisationUnitUserIdx].userId
                );
              }
            }
            if (
              innovationSupports[innovationSupportIdx].status ===
              InnovationSupportStatus.ENGAGING
            ) {
              if (
                organisationUnitUsers[organisationUnitUserIdx].role ===
                  "QUALIFYING_ACCESSOR" ||
                organisationUnitUsers[organisationUnitUserIdx].role ===
                  "ACCESSOR"
              ) {
                orgUnitUsersList.push(
                  organisationUnitUsers[organisationUnitUserIdx].userId
                );
              }
            }
          }
        }
        if (orgUnitUsersList.length != 0) {
          try {
            await this.notificationService.create(
              requestUser,
              NotificationAudience.ACCESSORS,
              userDetails.innovations[innovationIdx].id,
              NotifContextType.INNOVATION,
              NotifContextDetail.LOCK_USER,
              userDetails.innovations[innovationIdx].id,
              {},
              orgUnitUsersList
            );
          } catch (error) {
            this.logService.error(
              `An error has occured while creating a notification of type ${NotificationContextType.INNOVATION} from ${requestUser.id}`,
              error
            );
          }
        }
      }
    }

    const email = this.getUserEmail(user);

    try {
      await this.notificationService.sendEmail(
        requestUser,
        EmailNotificationTemplate.USER_ACCOUNT_LOCKED,
        null,
        user.id,
        [email],
        {
          display_name: user.displayName,
        }
      );
    } catch (error) {
      this.logService.error(
        `An error has occured while sending an email with the template ${EmailNotificationTemplate.USER_ACCOUNT_LOCKED}.`,
        error
      );
    }

    return {
      id: externalId,
      status: "OK",
    };
  }

  async lockUserNoNotifications(
    requestUser: RequestUser,
    externalId: string,
    graphAccessToken?: string,
    transaction?: EntityManager
  ): Promise<UserUpdateResult> {
    if (!requestUser || !externalId) {
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

    const user = await getUserFromB2C(externalId, graphAccessToken);
    if (!user) {
      throw new Error("Invalid user id.");
    }

    let result;
    try {
      if (!transaction) {
        result = await this.connection.transaction(async (trs) => {
          return await this.lockUserTransaction(
            trs,
            externalId,
            graphAccessToken
          );
        });
      } else {
        result = await this.lockUserTransaction(
          transaction,
          externalId,
          graphAccessToken
        );
      }
    } catch {
      throw new Error("Error locking user at IdP");
    }

    return {
      id: externalId,
      status: "OK",
    };
  }

  private async lockUserTransaction(
    transaction: EntityManager,
    externalId: string,
    graphAccessToken: string
  ) {
    await transaction.update(
      User,
      { externalId },
      {
        lockedAt: new Date(),
      }
    );
    return await this.userService.updateB2CUser(
      { accountEnabled: false },
      externalId,
      graphAccessToken
    );
  }

  async unlockUser(
    requestUser: RequestUser,
    userId: string,
    externalId: string,
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

    const user = await getUserFromB2C(externalId, graphAccessToken);
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
          externalId,
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

    const userOrganisations = await userToBeRemoved.userOrganisations;

    if (
      userToBeRemoved.type === "ACCESSOR" &&
      userOrganisations[0].role === AccessorOrganisationRole.QUALIFYING_ACCESSOR
    ) {
      return await this.runQualifyingAccessorUserValidation(userToBeRemoved);
    }

    if (
      userToBeRemoved.type === "ACCESSOR" &&
      userOrganisations[0].role === AccessorOrganisationRole.ACCESSOR
    ) {
      return await this.runAccessorUserValidation(userToBeRemoved);
    }

    if (userToBeRemoved.type === "ASSESSMENT") {
      return await this.runNeedsAssessmentUserValidation(userToBeRemoved);
    }

    if (userToBeRemoved.type === "INNOVATOR") {
      return {};
    }
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

  async userChangeUnitValidation(
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

    return await this.runUserChangeUnitValidation(userToBeChanged);
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

  async inactivateOrganisationUnits(
    requestUser: RequestUser,
    unitIds: string[]
  ): Promise<UpdateResult> {
    const correlationId = uuid();

    // GETS UNITS AND ITS USERS FROM DATABASE
    const { units, usersToLock } = await this.getUnitsWithUsers(unitIds);

    // BEGIN TRANSACTION (ALL OR NOTHING HERE)
    const result = await this.connection.transaction(async (transaction) => {
      // INACTIVATE LIST OF UNITS

      const inactivatedUnitsUpdateResult = await transaction.update<OrganisationUnit>(
        OrganisationUnit,
        { id: In(unitIds) },
        { inactivatedAt: new Date() }
      );

      // GET ORGANISATIONS, FROM THE LOCKED UNITS, THAT HAVE 0 ACTIVE UNITS REMAINING
      const organisationsToLock = await this.getAccessorOrgsWithoutActiveUnits(units, transaction);

      // INACTIVATE ORGANISATIONS, IF ANY, DUE TO NOT HAVING ACTIVE UNITS
      if(organisationsToLock.length > 0) {

        await transaction.update<Organisation>(
          Organisation,
          { id: In(organisationsToLock) },
          { inactivatedAt: new Date() }
        );

      }

      // LOCK USERS, THAT BELONG TO THE INACTIVATED UNITS, ON THE DATABASE.
      await transaction.update<User>(
        User,
        { id: In(usersToLock.map((u) => u.id)) },
        { lockedAt: new Date() }
      );

      // Failure does not rollback the transaction
      // backend and frontend have to validate if the user is locked during authentication
      // We will not rely only on the Identity Provider to check if the user is locked.
      await this.lockUsersAtIdentityProviderUsingQueue(usersToLock, requestUser, correlationId);

      return inactivatedUnitsUpdateResult;
    });

    return result;
  }


  /**
   * PRIVATE METHODS
   */

   private async lockUsersAtIdentityProviderUsingQueue(usersToLock: { externalId: string; id: string; }[], requestUser: RequestUser, correlationId: string) {
    for (const user of usersToLock) {
      // should not rollback the transaction
      // log the error and move on
      // backend and frontend will need to handle locked users
      try {
        await this.queueService.createQueueMessage<QueueMessageEnum.LOCK_USER>(
          QueueMessageEnum.LOCK_USER,
          { requestUser, identityId: user.externalId }
        );
      } catch (error) {
        this.logService.error(
          `CorrelationId: ${correlationId}. [Inactive Units] Error while creating queue message to lock user at the identity provider ${user.externalId}.`,
          {
            error,
          }
        );
      }
    }
  }

  private async getAccessorOrgsWithoutActiveUnits(units: OrganisationUnit[], transaction: EntityManager) {
    const organisations = [
      ...new Set(units.map((unit) => unit.organisation.id)),
    ];

    const organisationsToLock = [];
    for (const organisationId of organisations) {
      // FOR EACH ORGANISATION, CHECK IF IT HAS ANY ACTIVE UNITS
      const activeUnits = await this.organisationService.organisationActiveUnitsCount(
        organisationId,
        transaction
      );

      if (activeUnits.count === 0) {
        organisationsToLock.push(organisationId);
      }
    }
    return organisationsToLock;
  }

  private async getUnitsWithUsers(unitIds: string[]) {
    const units = await this.organisationService.findOrganisationUnitsByIds(
      unitIds
    );

    // GETS USERS FROM UNITS TO BE INACTIVATED
    const usersToLock = await this.organisationService.findOrganisationUnitsUsersByUnitIds(
      unitIds
    );
    return { units, usersToLock };
  }

  private async runNeedsAssessmentUserValidation(
    user: User
  ): Promise<{ [key: string]: any }> {
    const r = { ...assessmentRules };
    const checkAssessmentUser = await this.CheckAssessmentUser(user);
    if (r[checkAssessmentUser?.code.toString()]) {
      r[checkAssessmentUser?.code.toString()] = {
        ...checkAssessmentUser,
        valid: false,
      };
    }

    return r;
  }

  private async runQualifyingAccessorUserValidation(
    user: User
  ): Promise<{ [key: string]: any }> {
    const r = { ...qaRules };

    const accessorOrgRule = await this.CheckAccessorOrganisation(user);
    const accesorOrgUnitRule = await this.CheckAccessorOrganisationUnit(user);
    const accessorSupportRule = await this.checkAccessorSupports(user);

    if (r[accessorOrgRule?.code.toString()]) {
      r[accessorOrgRule?.code.toString()] = {
        ...accessorOrgRule,
        valid: false,
      };
    }

    if (r[accesorOrgUnitRule?.code.toString()]) {
      r[accesorOrgUnitRule?.code.toString()] = {
        ...accesorOrgUnitRule,
        valid: false,
      };
    }

    if (r[accessorSupportRule?.code.toString()]) {
      r[accessorSupportRule?.code.toString()] = {
        ...accessorSupportRule,
        valid: false,
      };
    }

    return r;
  }

  private async runAccessorUserValidation(
    user: User
  ): Promise<{ [key: string]: any }> {
    const r = { ...accessorRules };

    const accessorSupportRule = await this.checkAccessorSupports(user);

    if (r[accessorSupportRule?.code.toString()]) {
      r[accessorSupportRule?.code.toString()] = {
        ...accessorSupportRule,
        valid: false,
      };
    }

    return r;
  }

  private async runUserChangeUnitValidation(
    user: User
  ): Promise<{ [key: string]: any }> {
    const r = { ...unitrules };
    if (user.type === UserType.ACCESSOR) {
      const accessorOrgRule = await this.CheckAccessorOrganisation(user);
      const accesorOrgUnitRule = await this.CheckAccessorOrganisationUnit(user);
      const accessorSupportRule = await this.checkAccessorSupports(user);

      if (r[accessorOrgRule?.code.toString()]) {
        r[accessorOrgRule?.code.toString()] = {
          ...accessorOrgRule,
          valid: false,
        };
      }

      if (r[accesorOrgUnitRule?.code.toString()]) {
        r[accesorOrgUnitRule?.code.toString()] = {
          ...accesorOrgUnitRule,
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
          .innerJoin(
            "user",
            "usr",
            "orgUser.user_id = usr.id and usr.locked_at IS NULL"
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

  async deleteAdminAccounts(
    requestUser: RequestUser,
    userId: string
  ): Promise<AdminDeletionResult> {
    if (!requestUser || !userId) {
      throw new InvalidParamsError("Invalid params.");
    }

    let result: AdminDeletionResult;

    try {
      result = await this.deleteAdminAccount(requestUser, userId);
    } catch (err) {
      result = {
        id: userId,
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

  async deleteAdminAccount(
    requestUser: RequestUser,
    userId: string
  ): Promise<AdminDeletionResult> {
    const graphAccessToken = await authenticateWitGraphAPI();

    if (!graphAccessToken) {
      throw new Error("Invalid Credentials");
    }

    if (requestUser.type != "ADMIN") {
      throw new Error("This action is for Admins only");
    }

    const userToBeDeleted = await this.userService.getUser(userId);

    if (userToBeDeleted.type === "ADMIN") {
      return await this.connection.transaction(async (transactionManager) => {
        try {
          await deleteB2CAccount(userId);
          await transactionManager.update(
            User,
            { id: userId },
            {
              deletedAt: new Date(),
            }
          );

          return {
            id: userId,
            status: "OK",
          };
        } catch (error) {
          throw new Error(error);
        }
      });
    } else {
      throw new Error("The user you are trying to delete is not an ADMIN");
    }
  }
}
