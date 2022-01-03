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
  Role,
} from "@domain/index";
import {
  InvalidDataError,
  InvalidParamsError,
  InvalidUserTypeError,
} from "@services/errors";
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
  requestUser: {
    id: ":userId",
    type: UserType.ADMIN,
  },
};

describe("User (Service Roles) Service Suite", () => {
  let userService: UserService;
  let accessorService: AccessorService;
  let organisationService: OrganisationService;
  let organisation: Organisation;
  let organisationUnit: OrganisationUnit;

  beforeAll(async () => {
    //await setupTestsConnection();

    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });
    userService = new UserService(process.env.DB_TESTS_NAME);
    accessorService = new AccessorService(process.env.DB_TESTS_NAME);
    organisationService = new OrganisationService(process.env.DB_TESTS_NAME);

    organisation = await fixtures.createOrganisation(OrganisationType.ACCESSOR);
    organisationUnit = await fixtures.createOrganisationUnit(organisation);

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

    await query.from(OrganisationUnit).execute();
    await query.from(Organisation).execute();

    //closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(ActivityLog).execute();
    await query.from(NotificationPreference).execute();
    await query.from(OrganisationUnitUser).execute();
    await query.from(OrganisationUser).execute();
    await query.from(UserRole).execute();
    await query.from(Role).execute();
    await query.from(User).execute();
  });

  it("should retrieve user profile with roles", async () => {
    // Arrange
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue("access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: "Admin User",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });

    const adminUser = await fixtures.createAdminUser();

    let actual: ProfileModel;
    let err;

    // Act
    try {
      actual = await userService.getProfile(adminUser.id);
      console.log(JSON.stringify(actual));
    } catch (error) {
      err = error;
    }

    // Assert
    expect(err).toBeUndefined();
    expect(actual.roles.length).toBeGreaterThan(0);
  });
});
