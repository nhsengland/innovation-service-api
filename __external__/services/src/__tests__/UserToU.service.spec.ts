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
  TouType,
  TermsOfUseUser,
  TermsOfUse,
} from "@domain/index";
import { InvalidParamsError, InvalidUserTypeError } from "@services/errors";
import * as dotenv from "dotenv";
import * as path from "path";
import { getConnection, getRepository } from "typeorm";
import {
  closeTestsConnection,
  setupTestsConnection,
  TermsOfUseService,
} from "..";
import * as helpers from "../helpers";
import { ProfileModel } from "../models/ProfileModel";
import { AccessorService } from "../services/Accessor.service";
import { OrganisationService } from "../services/Organisation.service";
import { UserService } from "../services/User.service";
import * as fixtures from "../__fixtures__";

const dummy = {
  email: "email@email.com",
  requestUser: {
    id: "C7095D87-C3DF-46F6-A503-001B083F4630",
    externalId: "C7095D87-C3DF-46F6-A503-001B083F4630",
    type: UserType.ADMIN,
  },
};

describe("User ToU Service Suite", () => {
  let userService: UserService;
  let accessorService: AccessorService;
  let touService: TermsOfUseService;

  beforeAll(async () => {
    //await setupTestsConnection();
    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });
    userService = new UserService(process.env.DB_TESTS_NAME);
    accessorService = new AccessorService(process.env.DB_TESTS_NAME);
    touService = new TermsOfUseService(process.env.DB_TESTS_NAME);
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    //closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(TermsOfUseUser).execute();
    await query.from(UserRole).execute();
    await query.from(User).execute();
    await query.from(TermsOfUse).execute();

    jest.resetAllMocks();
  });

  it("should retrieve a user profile with terms of use accepted", async () => {
    // Arrange
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");

    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue({
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      displayName: ":userName",
    });

    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: "Innovator A",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });

    let actual: ProfileModel;
    let err;

    const innovatorUser = await fixtures.createInnovatorUser();

    const innovatorRequestUser = fixtures.getRequestUser(innovatorUser);

    const newToU = await touService.createTermsOfUse(dummy.requestUser, {
      name: "TERMS OF USE",
      summary: "TEST NAME",
      touType: TouType.INNOVATOR,
      releasedAt: new Date(),
    });

    try {
      await touService.acceptTermsOfUse(innovatorRequestUser, newToU.id);
    } catch (error) {
      err = error;
    }

    // Act
    try {
      actual = await userService.getProfile(
        innovatorRequestUser.id,
        innovatorRequestUser.externalId
      );
    } catch (error) {
      err = error;
    }

    // Assert
    expect(err).toBeUndefined();
    expect(actual.isTouAccepted).toEqual(true);
  });

  it("should retrieve a user profile with terms of use not accepted yet", async () => {
    // Arrange
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue("access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: "Innovator A",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });

    let actual: ProfileModel;
    let err;

    const innovatorUser = await fixtures.createInnovatorUser();

    const innovatorRequestUser = fixtures.getRequestUser(innovatorUser);

    const newToU = await touService.createTermsOfUse(dummy.requestUser, {
      name: "TERMS OF USE",
      summary: "TEST NAME",
      touType: TouType.INNOVATOR,
      releasedAt: new Date(),
    });

    // Act
    try {
      actual = await userService.getProfile(
        innovatorRequestUser.id,
        innovatorRequestUser.externalId
      );
    } catch (error) {
      err = error;
    }

    // Assert
    expect(err).toBeUndefined();
    expect(actual.isTouAccepted).toEqual(false);
  });
});
