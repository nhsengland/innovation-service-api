/**
 * @jest-environment node
 */
import {
  AccessorOrganisationRole,
  Organisation,
  OrganisationType,
  OrganisationUser,
  User,
  UserType,
} from "@domain/index";
import { getConnection, getRepository } from "typeorm";
import * as helpers from "../helpers";
import { closeTestsConnection, setupTestsConnection } from "..";
import { ProfileModel } from "../models/ProfileModel";
import { AccessorService } from "../services/Accessor.service";
import { OrganisationService } from "../services/Organisation.service";
import { UserService } from "../services/User.service";

describe("User Service Suite", () => {
  let adUserService: UserService;
  let accessorService: AccessorService;
  let organisationService: OrganisationService;

  beforeAll(async () => {
    // await setupTestsConnection();
    adUserService = new UserService(process.env.DB_TESTS_NAME);
    accessorService = new AccessorService(process.env.DB_TESTS_NAME);
    organisationService = new OrganisationService(process.env.DB_TESTS_NAME);
  });

  afterAll(async () => {
    // closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();
    await query.from(OrganisationUser).execute();
    await query.from(Organisation).execute();
    await query.from(User).execute();
  });

  it("should instantiate the User service", async () => {
    expect(adUserService).toBeDefined();
  });

  it("should update a user profile", async () => {
    // Arrange
    spyOn(helpers, "authenticateWitGraphAPI").and.returnValue(":access_token");
    spyOn(helpers, "saveB2CUser").and.callFake;

    let err;
    try {
      await adUserService.updateUserDisplayName(
        { displayName: "test" },
        ":oid"
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeUndefined();
  });

  it("should retrieve a user profile with organisation roles", async () => {
    // Arrange

    spyOn(helpers, "authenticateWitGraphAPI").and.returnValue(":access_token");
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
      actual = await adUserService.getProfile(accessor.id);
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
    spyOn(helpers, "authenticateWitGraphAPI").and.returnValue(":access_token");
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
      actual = await adUserService.getProfile(
        "8c179628-100d-4f95-bae4-2ccc64de77fe"
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeUndefined();
    expect(actual.type).toBeNull();
  });
});
