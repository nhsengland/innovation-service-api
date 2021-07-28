/**
 * @jest-environment node
 */
import {
  AccessorOrganisationRole,
  Organisation,
  OrganisationType,
  OrganisationUnit,
  OrganisationUnitUser,
  OrganisationUser,
  User,
  UserType,
} from "@domain/index";
import {
  InvalidDataError,
  InvalidParamsError,
  InvalidUserTypeError,
} from "@services/errors";
import { getConnection, getRepository } from "typeorm";
import { closeTestsConnection, setupTestsConnection } from "..";
import * as helpers from "../helpers";
import { ProfileModel } from "../models/ProfileModel";
import { AccessorService } from "../services/Accessor.service";
import { OrganisationService } from "../services/Organisation.service";
import { UserService } from "../services/User.service";
import * as fixtures from "../__fixtures__";
import * as dotenv from "dotenv";
import * as path from "path";

const dummy = {
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

    spyOn(helpers, "authenticateWitGraphAPI").and.returnValue(":access_token");
    spyOn(helpers, "getUserFromB2CByEmail").and.returnValue({
      id: ":userOid",
      displayName: ":userName",
    });
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(OrganisationUnit).execute();
    await query.from(Organisation).execute();

    // closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(OrganisationUnitUser).execute();
    await query.from(OrganisationUser).execute();
    await query.from(User).execute();
  });

  it("should instantiate the User service", async () => {
    expect(userService).toBeDefined();
  });

  it("should update a user profile", async () => {
    // Arrange
    spyOn(helpers, "saveB2CUser").and.callFake;

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
    spyOn(helpers, "getUserFromB2C").and.returnValue({
      displayName: "Accessor A",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });
    spyOn(
      getRepository(User, process.env.DB_TESTS_NAME),
      "findOne"
    ).and.returnValue({
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
    });

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
    spyOn(helpers, "getUserFromB2C").and.returnValue({
      displayName: "Accessor A",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });
    spyOn(
      getRepository(User, process.env.DB_TESTS_NAME),
      "findOne"
    ).and.returnValue(undefined);

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

  it("should throw when createUser with invalid user type params", async () => {
    let err;
    try {
      await userService.createUser(dummy.requestUser, {
        type: UserType.INNOVATOR,
        name: ":name",
        email: "email@email.pt",
        password: "myNewPassword1!",
      });
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidDataError);
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
    expect(result.organisationUserId).toBeDefined();
    expect(result.organisationUnitUserId).toBeDefined();
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

  it("should update an user", async () => {
    // arranje
    spyOn(userService, "updateB2CUser").and.callFake;
    spyOn(helpers, "getUserFromB2C").and.returnValue({
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
});
