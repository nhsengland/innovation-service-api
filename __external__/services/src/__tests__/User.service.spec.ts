/**
 * @jest-environment node
 */
import {
  AccessorOrganisationRole,
  ActivityLog,
  NotificationPreference,
  Organisation,
  OrganisationType,
  OrganisationUnit,
  OrganisationUnitUser,
  OrganisationUser,
  User,
  UserType,
  UserRole,
  Innovation,
  Role,
} from "@domain/index";
import { InvalidParamsError, InvalidUserTypeError } from "@services/errors";
import * as dotenv from "dotenv";
import * as path from "path";
import { getConnection, getRepository } from "typeorm";
import { closeTestsConnection, setupTestsConnection } from "..";
import * as helpers from "../helpers";
import { ProfileModel } from "../models/ProfileModel";
import { AccessorService } from "../services/Accessor.service";
import { OrganisationService } from "../services/Organisation.service";
import { UserService } from "../services/User.service";
import * as fixtures from "../__fixtures__";

const dummy = {
  email: "email@email.com",
  requestUser: {
    id: ":userId",
    type: UserType.ADMIN,
  },
};

describe("User Service Suite", () => {
  let userService: UserService;
  let accessorService: AccessorService;
  let organisationService: OrganisationService;
  let organisation: Organisation;
  let organisationUnit: OrganisationUnit;

  beforeAll(async () => {
    // await setupTestsConnection();
    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });
    userService = new UserService(process.env.DB_TESTS_NAME);
    accessorService = new AccessorService(process.env.DB_TESTS_NAME);
    organisationService = new OrganisationService(process.env.DB_TESTS_NAME);

    organisation = await fixtures.createOrganisation(OrganisationType.ACCESSOR);
    organisationUnit = await fixtures.createOrganisationUnit(organisation);
    await fixtures.createAdminRole();

    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue({
      id: ":userOid",
      displayName: ":userName",
    });
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(Role).execute();

    // closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(ActivityLog).execute();
    await query.from(NotificationPreference).execute();
    await query.from(OrganisationUnitUser).execute();
    await query.from(OrganisationUser).execute();
    await query.from(Innovation).execute();
    await query.from(UserRole).execute();
    await query.from(User).execute();
  });

  it("should instantiate the User service", async () => {
    expect(userService).toBeDefined();
  });

  it("should update a user profile", async () => {
    // Arrange
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue("access_token");
    jest.spyOn(helpers, "saveB2CUser").mockImplementation();

    let err;
    try {
      await userService.updateB2CUser({ displayName: "test" }, ":oid");
    } catch (error) {
      err = error;
    }

    expect(err).toBeUndefined();
  });

  it("should retrieve a user profile with organisation roles", async () => {
    // Arrange
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue("access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
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
      .spyOn(getRepository(User, process.env.DB_TESTS_NAME), "findOne")
      .mockResolvedValue({
        type: UserType.ACCESSOR,
        role: AccessorOrganisationRole.ACCESSOR,
        userOrganisations: [
          {
            organisation: {
              id: ":organisationId",
              name: ":organisationName",
              isShadow: false,
            },
          },
        ],
      } as any);

    let actual: ProfileModel;
    let err;

    const accessorObj = User.new({
      id: "abc-def-ghi",
    });
    const accessor = await accessorService.create(accessorObj);

    const organisationObj = Organisation.new({
      name: "Accessor Organisation 1",
      type: OrganisationType.ACCESSOR,
      size: "1 to 5 Employees",
      isShadow: false,
    });

    const organisation = await organisationService.create(organisationObj);

    try {
      await organisationService.addUserToOrganisation(
        accessor,
        organisation,
        AccessorOrganisationRole.ACCESSOR
      );
    } catch (error) {
      err = error;
    }

    // Act
    try {
      actual = await userService.getProfile(accessor.id);
    } catch (error) {
      err = error;
    }

    // Assert
    expect(err).toBeUndefined();
    expect(actual.displayName).toEqual("Accessor A");
    expect(actual.type).toEqual(UserType.ACCESSOR);
    expect(actual.organisations.length).toBeGreaterThan(0);
  });

  it("should retrieve a user B2C profile information", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue("access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
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
      .spyOn(getRepository(User, process.env.DB_TESTS_NAME), "findOne")
      .mockResolvedValue(undefined);

    let actual: ProfileModel;
    let err;

    try {
      actual = await userService.getProfile(
        "8c179628-100d-4f95-bae4-2ccc64de77fe"
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeUndefined();
    expect(actual.type).toBeNull();
  });

  it("should throw when createUsers with invalid params", async () => {
    let err;
    try {
      await userService.createUsers(null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should createUsers correctly", async () => {
    const result = await userService.createUsers(dummy.requestUser, [
      {
        type: UserType.ACCESSOR,
        name: ":name",
        email: "email@email.pt",
        password: "myNewPassword1!",
        organisationAcronym: organisation.acronym,
        organisationUnitAcronym: organisationUnit.acronym,
        role: AccessorOrganisationRole.ACCESSOR,
      },
    ]);

    expect(result).toBeDefined();
    expect(result[0].id).toBeDefined();
  });

  it("should have errors when createUser with invalid accessor params", async () => {
    let err;
    const result = await userService.createUsers(dummy.requestUser, [
      {
        type: UserType.ACCESSOR,
        name: ":name",
        email: "email@email.pt",
        password: "myNewPassword1!",
      },
    ]);

    expect(result).toBeDefined();
    expect(result[0].error).toBeDefined();
  });

  it("should throw when createUser with invalid params", async () => {
    let err;
    try {
      await userService.createUser(null, null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when createUser with invalid accessor params", async () => {
    let err;
    try {
      await userService.createUser(dummy.requestUser, {
        type: UserType.ACCESSOR,
        name: ":name",
        email: "email@email.pt",
        password: "myNewPassword1!",
      });
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when createUser with invalid requestUser type params", async () => {
    const requestUser = {
      id: ":user_id",
      type: UserType.ASSESSMENT,
    };

    let err;
    try {
      await userService.createUser(requestUser, {
        type: UserType.ASSESSMENT,
        name: ":name",
        email: "email@email.pt",
        password: "myNewPassword1!",
      });
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidUserTypeError);
  });

  it("should create an accessor user", async () => {
    const result = await userService.createUser(dummy.requestUser, {
      type: UserType.ACCESSOR,
      name: ":name",
      email: "email@email.pt",
      password: "myNewPassword1!",
      organisationAcronym: organisation.acronym,
      organisationUnitAcronym: organisationUnit.acronym,
      role: AccessorOrganisationRole.ACCESSOR,
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it("should create an assessment user", async () => {
    const result = await userService.createUser(dummy.requestUser, {
      type: UserType.ASSESSMENT,
      name: ":name",
      email: "email@email.pt",
      password: "myNewPassword1!",
    });

    expect(result).toBeDefined();
  });

  it("should throw when updateUsers with invalid params", async () => {
    let err;
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");

    try {
      await userService.updateUsers(null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when updateUser with invalid params", async () => {
    let err;
    try {
      await userService.updateUser(null, null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when updateProfile with invalid params", async () => {
    let err;
    try {
      await userService.updateProfile(null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should update an user profile", async () => {
    // arranje
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(userService, "updateB2CUser").mockImplementation();
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: "Accessor A",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });

    const result = await userService.updateProfile(dummy.requestUser, {
      displayName: ":displayName",
    });

    expect(result).toBeDefined();
    expect(result.id).toEqual(dummy.requestUser.id);
  });

  it("should update an user profile with organisations", async () => {
    // arranje
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(userService, "updateB2CUser").mockImplementation();
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: "Accessor A",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });

    const result = await userService.updateProfile(dummy.requestUser, {
      displayName: ":displayName",
      organisation: {
        id: organisation.id,
        name: "TEST",
      },
    });

    expect(result).toBeDefined();
    expect(result.id).toEqual(dummy.requestUser.id);
  });

  it("should throw an error if authentication with graph api returns a null access token", async () => {
    const innovatorUser = await fixtures.createInnovatorUser();
    // Arrange
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: "Accessor A",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });
    jest.spyOn(helpers, "deleteB2CAccount").mockImplementation();
    const fakeRequestUser = {
      requestUser: {
        id: innovatorUser.id,
        type: UserType.INNOVATOR,
      },
    };
    // Act
    let err;
    try {
      await userService.deleteAccount(fakeRequestUser.requestUser);
    } catch (error) {
      err = error;
    }
    // Assert
    expect(err).not.toBeDefined();
  });

  it("should throw an error if user does not exist on B2C", async () => {
    // Arrange
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest
      .spyOn(helpers, "getUserFromB2C")
      .mockRejectedValue(new Error("User Not found"));
    const fakeRequestUser = {
      requestUser: {
        id: ":userId",
        type: UserType.INNOVATOR,
      },
    };
    // Act
    let err;
    try {
      await userService.deleteAccount(fakeRequestUser.requestUser);
    } catch (error) {
      err = error;
    }
    // Assert
    expect(err).toBeDefined();
    expect(err.message.toLocaleLowerCase()).toBe("user not found");
  });

  it("It should delete a User and archive innovations", async () => {
    // Arrange
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue("access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: "Accessor A",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });
    jest.spyOn(helpers, "deleteB2CAccount");
    const fakeRequestUser = {
      requestUser: {
        id: ":userId",
        type: UserType.INNOVATOR,
      },
    };
    // Act
    let err;
    let actual;
    try {
      actual = await userService.deleteAccount(fakeRequestUser.requestUser);
    } catch (error) {
      err = error;
    }
    // Assert
    expect(err).not.toBeDefined();
    expect(actual).toBe(true);
  });

  it("It should not delete a User and archive innovations", async () => {
    // Arrange
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
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
      .spyOn(helpers, "deleteB2CAccount")
      .mockRejectedValue("delete user failed");
    const fakeRequestUser = {
      requestUser: {
        id: ":userId",
        type: UserType.INNOVATOR,
      },
    };
    // Act
    let err;
    let actual;
    try {
      actual = await userService.deleteAccount(fakeRequestUser.requestUser);
    } catch (error) {
      err = error;
    }
    // Assert
    expect(err).toBeDefined();
    expect(err.message.toLocaleLowerCase()).toBe("error updating user.");
    expect(actual).toBeUndefined();
  });

  it("Should searchUsersByEmail ", async () => {
    // Arrange
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      id: "user_id_from_b2c",
      displayName: "Accessor A",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });
    const fakeRequestUser = {
      requestUser: {
        id: ":userId",
        type: UserType.INNOVATOR,
      },
    };
    // Act
    let err;
    try {
      await userService.searchUsersByEmail(fakeRequestUser.requestUser, [
        dummy.email,
      ]);
    } catch (error) {
      err = error;
    }
    // Assert
    expect(err).toBeDefined();
  });

  it("Should searchUsersByEmail with invalid parameter", async () => {
    // Arrange
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      id: "user_id_from_b2c",
      displayName: "Accessor A",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });
    const fakeRequestUser = {
      requestUser: {
        id: ":userId",
        type: UserType.INNOVATOR,
      },
    };
    // Act
    let err;
    try {
      await userService.searchUsersByEmail(null, [dummy.email]);
    } catch (error) {
      err = error;
    }
    // Assert
    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("Should get user full details", async () => {
    // Arrange
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      id: "user_id_from_b2c",
      displayName: "Innovator",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });

    jest
      .spyOn(getRepository(User, process.env.DB_TESTS_NAME), "findOne")
      .mockResolvedValue({
        type: UserType.INNOVATOR,
        userOrganisations: [
          {
            organisation: {
              id: ":organisationId",
              name: ":organisationName",
              isShadow: false,
            },
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
      } as any);

    const innovatorUser = await fixtures.createInnovatorUser();
    const innovation = await fixtures.saveInnovation(
      fixtures.generateInnovation({
        owner: innovatorUser,
        surveyId: "abc",
      })
    );

    // Act
    const result = await userService.getUserDetails(innovatorUser.id, "FULL");

    // Assert
    expect(result).toBeDefined();
    expect(result.innovations).toBeDefined();
  });

  it("should update user role", async () => {
    // Arrange
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue("access_token");
    jest.spyOn(helpers, "saveB2CUser").mockImplementation();

    const accessorObj = User.new({
      id: "abc-def-ghi",
    });
    const accessor = await accessorService.create(accessorObj);

    const organisationObj = Organisation.new({
      name: "Accessor Organisation 1",
      type: OrganisationType.ACCESSOR,
      size: "1 to 5 Employees",
      isShadow: false,
    });

    const organisation = await organisationService.create(organisationObj);
    let err;
    try {
      await organisationService.addUserToOrganisation(
        accessor,
        organisation,
        AccessorOrganisationRole.QUALIFYING_ACCESSOR
      );
    } catch (error) {
      err = error;
    }

    try {
      await userService.updateUserRole(
        dummy.requestUser,
        accessorObj.id,
        AccessorOrganisationRole.ACCESSOR
      );
    } catch (error) {
      err = error;
    }
    // Assert
    expect(err).toBeUndefined();
  });

  it("should create a new ADMIN user", async () => {
    //Arrange
    const user = {
      type: UserType.ADMIN,
      name: ":name",
      email: "email@email.pt",
      password: "myNewPassword1!",
    };

    const requestUser = {
      id: "request_user_id",
      type: UserType.ADMIN,
    };

    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");

    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue(false);

    jest.spyOn(helpers, "createB2CUser").mockResolvedValue({
      id: "user_id_from_b2c",
      displayName: "Admin User",
    });

    //Act
    const result = await userService.createUser(requestUser, user);

    //Assert
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.status).toBe("OK");
  });

  it("should update user's organisation unit", async () => {
    // Arrange
    const user = await fixtures.createAccessorUser();

    const organisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );

    const organisationAccessorUser = await fixtures.addUserToOrganisation(
      user,
      organisation,
      AccessorOrganisationRole.ACCESSOR
    );

    const organisationUnit = await fixtures.createOrganisationUnit(
      organisation
    );

    const organisationUnitAccessorUser = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationAccessorUser,
      organisationUnit
    );

    let err;
    try {
      //Act
      await userService.updateUserOrganisationUnit(
        user.id,
        "newUnit",
        organisation.id
      );
    } catch (error) {
      err = error;
    }

    // Assert
    expect(err).toBeUndefined();
  });
});
