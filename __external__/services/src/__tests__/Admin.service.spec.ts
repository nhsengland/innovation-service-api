import { InvalidParamsError, InvalidUserRoleError } from "@services/errors";
import { ProfileSlimModel } from "@services/models/ProfileSlimModel";
import { AdminService } from "@services/services/Admin.service";
import { UserService } from "@services/services/User.service";
import { UserSearchResult } from "@services/types";
import * as dotenv from "dotenv";
import * as path from "path";
import { getConnection } from "typeorm";
import {
  AccessorOrganisationRole,
  closeTestsConnection,
  InnovatorOrganisationRole,
  Organisation,
  OrganisationType,
  OrganisationUnit,
  OrganisationUnitUser,
  OrganisationUser,
  setupTestsConnection,
  User,
  UserRole,
  UserType,
} from "..";
import { QueueProducer } from "../../../../utils/queue-producer";
import * as helpers from "../helpers";
import * as fixtures from "../__fixtures__";

describe("[User Account Lock suite", () => {
  let adminService: AdminService;
  beforeAll(async () => {
    // await setupTestsConnection();

    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });
    adminService = new AdminService(process.env.DB_TESTS_NAME);
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(OrganisationUnitUser).execute();
    await query.from(OrganisationUser).execute();
    await query.from(UserRole).execute();
    await query.from(User).execute();
    await query.from(OrganisationUnit).execute();
    await query.from(Organisation).execute();
  });

  afterAll(async () => {
    // await closeTestsConnection();
  });
  it("Should not lock User if is last assessment user", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      displayName: "Accessor A",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });

    jest.spyOn(helpers, "saveB2CUser").mockImplementation();
    const assessmentUser = await fixtures.createAssessmentUser();
    const requestUser = {
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      type: UserType.ADMIN,
    };
    // Act

    const result = await adminService.userLockValidation(assessmentUser.id);

    expect(result).toBeDefined();
    expect(result.lastAssessmentUserOnPlatform.valid).toBe(false);
  });

  it("Should not lock User if is last assessment user when there other locked users", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      displayName: "Accessor A",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });

    jest.spyOn(helpers, "saveB2CUser").mockImplementation();
    await fixtures.createAssessmentUser(new Date());
    await fixtures.createAssessmentUser(new Date());
    const assessmentUser = await fixtures.createAssessmentUser();
    const requestUser = {
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      type: UserType.ADMIN,
    };
    // Act

    const result = await adminService.userLockValidation(assessmentUser.id);

    expect(result).toBeDefined();
    expect(result.lastAssessmentUserOnPlatform.valid).toBe(false);
  });

  it("Should lock Assessment User if is not last assessment user", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      displayName: "Accessor A",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });
    jest
      .spyOn(QueueProducer.prototype, "sendNotification")
      .mockResolvedValue(undefined);
    jest
      .spyOn(QueueProducer.prototype, "sendNotification")
      .mockRejectedValue("Error");
    jest.spyOn(helpers, "saveB2CUser").mockImplementation();
    const assessmentUser1 = await fixtures.createAssessmentUser();
    const assessmentUser2 = await fixtures.createAssessmentUser();
    const requestUser = {
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      externalId: "C7095D87-C3DF-46F6-A503-001B083F4630",
      type: UserType.ADMIN,
    };
    // Act

    const result = await adminService.lockUsers(
      requestUser,
      assessmentUser1.externalId
    );

    expect(result.error).toBeUndefined();
    expect(result.status).toBe("OK");
  });

  it("Should not lock accessor if its the only one on the organisation", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      displayName: "Accessor A",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });

    const innovatorUser = await fixtures.createInnovatorUser();
    const innovatorOrganisation = await fixtures.createOrganisation(
      OrganisationType.INNOVATOR
    );
    await fixtures.addUserToOrganisation(
      innovatorUser,
      innovatorOrganisation,
      InnovatorOrganisationRole.INNOVATOR_OWNER
    );

    const accessorUser = await fixtures.createAccessorUser();

    const accessorOrganisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );

    const organisationAccessorUser = await fixtures.addUserToOrganisation(
      accessorUser,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );

    const organisationUnit = await fixtures.createOrganisationUnit(
      accessorOrganisation
    );

    const organisationUnitAccessorUser = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationAccessorUser,
      organisationUnit
    );

    const requestUser = {
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      type: UserType.ADMIN,
    };

    const result = await adminService.userLockValidation(accessorUser.id);

    expect(result).toBeDefined();
    expect(result.lastAccessorUserOnOrganisation.valid).toBe(false);
    expect(result.lastAccessorUserOnOrganisationUnit.valid).toBe(false);
    expect(result.lastAccessorFromUnitProvidingSupport.valid).toBe(true);
  });

  it("Should not lock accessor if its the only one on the organisation unit", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      displayName: "Accessor A",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });

    const innovatorUser = await fixtures.createInnovatorUser();
    const innovatorOrganisation = await fixtures.createOrganisation(
      OrganisationType.INNOVATOR
    );
    await fixtures.addUserToOrganisation(
      innovatorUser,
      innovatorOrganisation,
      InnovatorOrganisationRole.INNOVATOR_OWNER
    );

    const accessorUser1 = await fixtures.createAccessorUser();
    const accessorUser2 = await fixtures.createAccessorUser();

    const accessorOrganisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );

    const organisationAccessorUser1 = await fixtures.addUserToOrganisation(
      accessorUser1,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );
    const organisationAccessorUser2 = await fixtures.addUserToOrganisation(
      accessorUser2,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );

    const organisationUnit1 = await fixtures.createOrganisationUnit(
      accessorOrganisation
    );
    const organisationUnit2 = await fixtures.createOrganisationUnit(
      accessorOrganisation
    );

    const organisationUnitAccessorUser1 = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationAccessorUser1,
      organisationUnit1
    );
    const organisationUnitAccessorUser2 = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationAccessorUser2,
      organisationUnit2
    );

    const requestUser = {
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      type: UserType.ADMIN,
    };

    jest.spyOn(UserService.prototype, "updateB2CUser").mockResolvedValue(true);

    const result = await adminService.userLockValidation(accessorUser1.id);

    expect(result).toBeDefined();
    expect(result.lastAccessorUserOnOrganisation.valid).toBe(true);
    expect(result.lastAccessorUserOnOrganisationUnit.valid).toBe(false);
    expect(result.lastAccessorFromUnitProvidingSupport.valid).toBe(true);
  });

  it("Should lock accessor if its NOT the only one on the organisation AND organisation unit", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      displayName: "Accessor A",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });
    jest.spyOn(helpers, "saveB2CUser").mockImplementation();

    const innovatorUser = await fixtures.createInnovatorUser();
    const innovatorOrganisation = await fixtures.createOrganisation(
      OrganisationType.INNOVATOR
    );
    await fixtures.addUserToOrganisation(
      innovatorUser,
      innovatorOrganisation,
      InnovatorOrganisationRole.INNOVATOR_OWNER
    );

    const accessorUser1 = await fixtures.createAccessorUser();
    const accessorUser2 = await fixtures.createAccessorUser();

    const accessorOrganisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );

    const organisationAccessorUser1 = await fixtures.addUserToOrganisation(
      accessorUser1,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );
    const organisationAccessorUser2 = await fixtures.addUserToOrganisation(
      accessorUser2,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );

    const organisationUnit1 = await fixtures.createOrganisationUnit(
      accessorOrganisation
    );

    const organisationUnitAccessorUser1 = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationAccessorUser1,
      organisationUnit1
    );
    const organisationUnitAccessorUser2 = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationAccessorUser2,
      organisationUnit1
    );

    const requestUser = {
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      type: UserType.ADMIN,
    };

    const result = await adminService.userLockValidation(accessorUser1.id);

    expect(result).toBeDefined();
    expect(result.lastAccessorUserOnOrganisation.valid).toBe(true);
    expect(result.lastAccessorUserOnOrganisationUnit.valid).toBe(true);
    expect(result.lastAccessorFromUnitProvidingSupport.valid).toBe(true);
  });

  it("should not create user if already exists", async () => {
    //Arrange
    const userAssessment1 = {
      type: UserType.ASSESSMENT,
      name: ":name",
      email: "email@email.pt",
    };

    const userAssessment2 = {
      type: UserType.ASSESSMENT,
      name: ":name",
      email: "email@email.pt",
    };

    const requestUser = {
      id: "request_user_id",
      externalId: "request_user_id",
      type: UserType.ADMIN,
    };

    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");

    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue({
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      displayName: "Admin user",
    });

    jest.spyOn(helpers, "createB2CUser").mockResolvedValue({
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      displayName: "New Assessment User",
    });

    await adminService.createUser(requestUser, userAssessment1);

    //Act
    const result = await adminService.createUser(requestUser, userAssessment2);

    //Assert
    expect(result).toBeDefined();
    expect(result.status).toBe("ERROR");
  });

  it("should not create ACCESSOR user with invalid params", async () => {
    //Arrange
    const organisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );
    const organisationUnit = await fixtures.createOrganisationUnit(
      organisation
    );

    const user = {
      type: UserType.ACCESSOR,
      name: ":name",
      email: "email@email.pt",
      password: "myNewPassword1!",
    };

    const requestUser = {
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      externalId: "C7095D87-C3DF-46F6-A503-001B083F4630",
      type: UserType.ADMIN,
    };

    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");

    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue(false);

    jest.spyOn(helpers, "createB2CUser").mockResolvedValue({
      id: "user_id_from_b2c",
      displayName: "Accessor User",
    });

    //Act
    const result = await adminService.createUser(requestUser, user);

    //Assert
    expect(result).toBeDefined();
    expect(result.status).toBe("ERROR");
  });

  it("should not create user with  invalid requestUser param", async () => {
    //Arrange
    const organisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );

    const user = {
      type: UserType.ACCESSOR,
      name: ":name",
      email: "email@email.pt",
      password: "myNewPassword1!",
      role: AccessorOrganisationRole.QUALIFYING_ACCESSOR,
      organisationAcronym: organisation.acronym,
    };

    const requestUser = {
      id: "request_user_id",
      externalId: "request_user_id",
      type: UserType.ASSESSMENT,
    };

    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");

    //Act
    const result = await adminService.createUser(requestUser, user);

    //Assert
    expect(result).toBeDefined();
    expect(result.status).toBe("ERROR");
  });

  it("should create a new ASSESSMENT user", async () => {
    //Arrange
    const user = {
      type: UserType.ASSESSMENT,
      name: ":name",
      email: "email@email.pt",
    };

    const requestUser = {
      id: "request_user_id",
      externalId: "request_user_id",
      type: UserType.ADMIN,
    };

    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");

    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue(false);

    jest.spyOn(helpers, "createB2CUser").mockResolvedValue({
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      displayName: "New Assessment User",
    });

    //Act
    const result = await adminService.createUser(requestUser, user);

    //Assert
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.status).toBe("OK");
  });

  it("should create a new ACCESSOR user", async () => {
    //Arrange
    const organisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );
    const organisationUnit = await fixtures.createOrganisationUnit(
      organisation
    );

    const user = {
      type: UserType.ACCESSOR,
      name: ":name",
      email: "email@email.pt",
      password: "myNewPassword1!",
      organisationAcronym: organisation.acronym,
      organisationUnitAcronym: organisationUnit.acronym,
      role: AccessorOrganisationRole.ACCESSOR,
    };

    const requestUser = {
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      externalId: "C7095D87-C3DF-46F6-A503-001B083F4630",
      type: UserType.ADMIN,
    };

    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");

    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue(false);

    jest.spyOn(helpers, "createB2CUser").mockResolvedValue({
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      displayName: "Accessor User",
    });

    //Act
    const result = await adminService.createUser(requestUser, user);

    //Assert
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.status).toBe("OK");
  });

  it("should search users by type", async () => {
    //Arrange
    jest.spyOn(UserService.prototype, "getUsersOfTypePaged").mockResolvedValue([
      {
        id: "C7095D87-C3DF-46F6-A503-001B083F4630",
        externalId: "C7095D87-C3DF-46F6-A503-001B083F4630",
        type: UserType.ASSESSMENT,
      },
      {
        id: "D7095D87-C3DF-46F6-A503-001B083F4630",
        externalId: "D7095D87-C3DF-46F6-A503-001B083F4630",
        type: UserType.INNOVATOR,
      },
    ] as any);

    jest.spyOn(UserService.prototype, "getListOfUsers").mockResolvedValue([
      {
        id: "C7095D87-C3DF-46F6-A503-001B083F4630",
        externalId: "C7095D87-C3DF-46F6-A503-001B083F4630",
        displayName: "Assessment User",
      },
      {
        id: "D7095D87-C3DF-46F6-A503-001B083F4630",
        externalId: "D7095D87-C3DF-46F6-A503-001B083F4630",
        displayName: "Innovator User",
      },
    ] as ProfileSlimModel[]);

    //Act
    const result = await adminService.getUsersOfType(UserType.ASSESSMENT);

    //Assert
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it("should search users with organisations by type", async () => {
    //Arrange
    jest.spyOn(UserService.prototype, "getUsersOfTypePaged").mockResolvedValue([
      {
        id: "C7095D87-C3DF-46F6-A503-001B083F4630",
        externalId: "C7095D87-C3DF-46F6-A503-001B083F4630",
        type: UserType.ACCESSOR,
        userOrganisations: [
          {
            id: "org-id",
            organisation: {
              name: "org-name",
            },
            role: AccessorOrganisationRole.ACCESSOR,
            userOrganisationUnits: [
              {
                id: "unit-id",
                organisationUnit: {
                  name: "unit-name",
                },
              },
            ],
          },
        ],
      },
      {
        id: "D7095D87-C3DF-46F6-A503-001B083F4630",
        externalId: "D7095D87-C3DF-46F6-A503-001B083F4630",
        type: UserType.INNOVATOR,
      },
    ] as any);

    jest.spyOn(UserService.prototype, "getListOfUsers").mockResolvedValue([
      {
        id: "C7095D87-C3DF-46F6-A503-001B083F4630",
        externalId: "C7095D87-C3DF-46F6-A503-001B083F4630",
        displayName: "Accessor User",
      },
      {
        id: "D7095D87-C3DF-46F6-A503-001B083F4630",
        externalId: "D7095D87-C3DF-46F6-A503-001B083F4630",
        displayName: "Innovator User",
      },
    ] as ProfileSlimModel[]);

    //Act
    const result = await adminService.getUsersOfType(UserType.ACCESSOR);

    //Assert
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it("should search users by email", async () => {
    //Arrange
    jest.spyOn(UserService.prototype, "searchUserByEmail").mockResolvedValue({
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      externalId: "C7095D87-C3DF-46F6-A503-001B083F4630",
      displayName: "UserA",
      email: "xyz@email.com",
    } as UserSearchResult);

    //Act
    const result = await adminService.searchUser("xyz@email.com", false);

    //Assert
    expect(result).toBeDefined();
    expect(result.length).toBe(1);
  });

  it("should return null if user not found in B2C", async () => {
    //Arrange
    jest
      .spyOn(UserService.prototype, "searchUserByEmail")
      .mockResolvedValue({ id: ":userId" } as any);

    //Act
    const result = await adminService.searchUser("xyz@email.com", true);

    //Assert
    expect(result.length).toBe(0);
  });

  it("should return null if user not found in B2C", async () => {
    //Arrange
    jest
      .spyOn(UserService.prototype, "searchUserByEmail")
      .mockResolvedValue(null);

    //Act
    const result = await adminService.searchUser("xyz@email.com", true);

    //Assert
    expect(result.length).toBe(0);
  });
  it("should get user details by id", async () => {
    //Arrange
    jest.spyOn(UserService.prototype, "getUserDetails").mockResolvedValue({
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      externalId: "C7095D87-C3DF-46F6-A503-001B083F4630",
      displayName: "UserA",
    });

    //Act
    const result = await adminService.getUserDetails("abc");

    //Assert
    expect(result).toBeDefined();
  });

  it("Should not lock users if request user is not ADMIN", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");

    const requestUser = {
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      externalId: "C7095D87-C3DF-46F6-A503-001B083F4630",
      type: UserType.ACCESSOR,
    };

    const result = await adminService.lockUsers(requestUser, "test");

    expect(result.error).toBeDefined();
  });

  it("Should not lock if user not found on B2C", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue(null);

    const assessmentUser = await fixtures.createAssessmentUser();

    const requestUser = {
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      externalId: "C7095D87-C3DF-46F6-A503-001B083F4630",
      type: UserType.ADMIN,
    };

    const result = await adminService.lockUsers(requestUser, assessmentUser.id);

    expect(result.error).toBeDefined();
  });

  it("Should check if user exists on B2C", async () => {
    jest
      .spyOn(UserService.prototype, "userExistsAtB2C")
      .mockResolvedValue(true);

    const result = await adminService.userExistsB2C("xyz@email.com");

    expect(result).toBe(true);
  });

  it("Should throw error on lock users if invalid parameter - requestUser", async () => {
    let err;
    try {
      await adminService.lockUsers(null, "test");
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("Should throw error on lock users if invalid parameter - userId", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");

    const requestUser = {
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      externalId: "C7095D87-C3DF-46F6-A503-001B083F4630",
      type: UserType.ADMIN,
    };

    const result = await adminService.lockUsers(requestUser, null);

    expect(result.error).toBeDefined();
  });

  it("Should change accessor role if its NOT the only one on the organisation AND organisation unit", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      displayName: "Accessor A",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });
    jest.spyOn(helpers, "saveB2CUser").mockImplementation();

    const innovatorUser = await fixtures.createInnovatorUser();
    const innovatorOrganisation = await fixtures.createOrganisation(
      OrganisationType.INNOVATOR
    );
    await fixtures.addUserToOrganisation(
      innovatorUser,
      innovatorOrganisation,
      InnovatorOrganisationRole.INNOVATOR_OWNER
    );

    const accessorUser1 = await fixtures.createAccessorUser();
    const accessorUser2 = await fixtures.createAccessorUser();

    const accessorOrganisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );

    const organisationAccessorUser1 = await fixtures.addUserToOrganisation(
      accessorUser1,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );
    const organisationAccessorUser2 = await fixtures.addUserToOrganisation(
      accessorUser2,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );

    const organisationUnit1 = await fixtures.createOrganisationUnit(
      accessorOrganisation
    );

    const organisationUnitAccessorUser1 = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationAccessorUser1,
      organisationUnit1
    );
    const organisationUnitAccessorUser2 = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationAccessorUser2,
      organisationUnit1
    );

    const requestUser = {
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      type: UserType.ADMIN,
    };

    const result = await adminService.userChangeRoleValidation(
      accessorUser1.id
    );

    expect(result).toBeDefined();
    expect(result.lastAccessorUserOnOrganisationUnit.valid).toBe(true);
  });

  it("Should not change accessor role if its the only one on the organisation unit", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      displayName: "Accessor A",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });

    const innovatorUser = await fixtures.createInnovatorUser();
    const innovatorOrganisation = await fixtures.createOrganisation(
      OrganisationType.INNOVATOR
    );
    await fixtures.addUserToOrganisation(
      innovatorUser,
      innovatorOrganisation,
      InnovatorOrganisationRole.INNOVATOR_OWNER
    );

    const accessorUser1 = await fixtures.createAccessorUser();
    const accessorUser2 = await fixtures.createAccessorUser();

    const accessorOrganisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );

    const organisationAccessorUser1 = await fixtures.addUserToOrganisation(
      accessorUser1,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );
    const organisationAccessorUser2 = await fixtures.addUserToOrganisation(
      accessorUser2,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );

    const organisationUnit1 = await fixtures.createOrganisationUnit(
      accessorOrganisation
    );
    const organisationUnit2 = await fixtures.createOrganisationUnit(
      accessorOrganisation
    );

    const organisationUnitAccessorUser1 = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationAccessorUser1,
      organisationUnit1
    );
    const organisationUnitAccessorUser2 = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationAccessorUser2,
      organisationUnit2
    );

    const requestUser = {
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      externalId: "C7095D87-C3DF-46F6-A503-001B083F4630",
      type: UserType.ADMIN,
    };

    jest.spyOn(UserService.prototype, "updateB2CUser").mockResolvedValue(true);

    const result = await adminService.userChangeRoleValidation(
      accessorUser1.id
    );

    expect(result).toBeDefined();
    expect(result.lastAccessorUserOnOrganisationUnit.valid).toBe(false);
  });

  it("should throw an error when createUser() with invalid params", async () => {
    let err;
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    try {
      await adminService.createUser(undefined, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw an error when lockUsers() with invalid params", async () => {
    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      displayName: "Accessor A",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });

    jest.spyOn(helpers, "saveB2CUser").mockImplementation();
    const assessmentUser1 = await fixtures.createAssessmentUser();
    const assessmentUser2 = await fixtures.createAssessmentUser();
    const requestUser = {
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      externalId: "C7095D87-C3DF-46F6-A503-001B083F4630",
      type: UserType.ADMIN,
    };
    // Act

    const result = await adminService.lockUsers(
      requestUser,
      assessmentUser1.externalId
    );

    expect(result.error).toBeUndefined();
    expect(result.status).toBe("OK");
  });

  it("Should throw error on unlock users if invalid parameters", async () => {
    let err;
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    try {
      await adminService.unlockUser(undefined, undefined, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("Should update user role", async () => {
    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
    });
    jest.spyOn(UserService.prototype, "updateUserRole").mockImplementation();

    const requestUser = {
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      externalId: "C7095D87-C3DF-46F6-A503-001B083F4630",
      type: UserType.ADMIN,
    };

    const result = await adminService.updateUserRole(
      requestUser,
      ":userId",
      AccessorOrganisationRole.ACCESSOR
    );

    expect(result).toBeDefined();
  });

  it("Should throw error on change user role if invalid parameters", async () => {
    let err;
    try {
      await adminService.updateUserRole(
        undefined,
        ":userId",
        AccessorOrganisationRole.ACCESSOR
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("Should throw error on chanege user role if invalid requestor", async () => {
    let err;
    const requestUser = {
      id: "request_user_id",
      externalId: "request_user_id",
      type: UserType.ASSESSMENT,
    };
    try {
      await adminService.updateUserRole(
        requestUser,
        ":userId",
        AccessorOrganisationRole.QUALIFYING_ACCESSOR
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidUserRoleError);
  });

  it("should throw error when deleting the admin user ", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "deleteB2CAccount").mockImplementation();
    jest.spyOn(UserService.prototype, "getUser").mockResolvedValue({
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      externalId: "C7095D87-C3DF-46F6-A503-001B083F4630",
      type: UserType.INNOVATOR,
      deleteReason: null,
      userOrganisations: null,
      lockedAt: null,
      serviceRoles: null,
      createdAt: null,
      createdBy: null,
      updatedAt: null,
      updatedBy: null,
      deletedAt: null,
      termsOfUseUsers: null,
      firstTimeSignInAt: null,
      surveyId: null,
    });

    const adminUser = await fixtures.createAdminUser();
    const fakeRequestUser = {
      requestUser: {
        id: adminUser.id,
        externalId: adminUser.externalId,
        type: UserType.ADMIN,
      },
    };

    let err;
    try {
      await adminService.deleteAdminAccount(fakeRequestUser.requestUser, "abc");
    } catch (e) {
      err = e;
    }

    expect(err).toBeDefined();
  });

  it("should delete the admin user", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "deleteB2CAccount").mockImplementation();
    jest.spyOn(UserService.prototype, "getUser").mockResolvedValue({
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      externalId: "C7095D87-C3DF-46F6-A503-001B083F4630",
      type: UserType.ADMIN,
      deleteReason: null,
      userOrganisations: null,
      lockedAt: null,
      serviceRoles: null,
      createdAt: null,
      createdBy: null,
      updatedAt: null,
      updatedBy: null,
      deletedAt: null,
      termsOfUseUsers: null,
      surveyId: null,
      firstTimeSignInAt: null,
    });

    const adminRequestUser = await fixtures.createAdminUser();
    const fakeRequestUser = {
      requestUser: {
        id: adminRequestUser.id,
        externalId: adminRequestUser.externalId,
        type: UserType.ADMIN,
      },
    };

    const result = await adminService.deleteAdminAccount(
      fakeRequestUser.requestUser,
      "C7095D87-C3DF-46F6-A503-001B083F4630"
    );
    expect(result).toBeDefined();
    expect(result.status).toBe("OK");
  });
});
