import { UserService } from "@services/services/User.service";
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
  UserType,
} from "..";
import * as fixtures from "../__fixtures__";
import * as dotenv from "dotenv";
import * as path from "path";
import * as helpers from "../helpers";
import { getConnection } from "typeorm";

describe("[User Account Lock suite", () => {
  let userService: UserService;
  beforeAll(async () => {
    //await setupTestsConnection();

    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });
    userService = new UserService(process.env.DB_TESTS_NAME);
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(OrganisationUnitUser).execute();
    await query.from(OrganisationUser).execute();
    await query.from(User).execute();
    await query.from(OrganisationUnit).execute();
    await query.from(Organisation).execute();
  });

  afterAll(async () => {
    //await closeTestsConnection();
  });
  it("Should not lock User if is last assessment user", async () => {
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

    jest.spyOn(helpers, "saveB2CUser").mockImplementation();
    const assessmentUser = await fixtures.createAssessmentUser();
    const requestUser = {
      id: "request_user_id",
      type: UserType.ADMIN,
    };
    // Act

    const result = await userService.lockUsers(requestUser, [
      assessmentUser.id,
    ]);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].error.code).toBe("LastAssessmentUserOnPlatformError");
  });

  it("Should lock Assessment User if is not last assessment user", async () => {
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

    jest.spyOn(helpers, "saveB2CUser").mockImplementation();
    const assessmentUser1 = await fixtures.createAssessmentUser();
    const assessmentUser2 = await fixtures.createAssessmentUser();
    const requestUser = {
      id: "request_user_id",
      type: UserType.ADMIN,
    };
    // Act

    const result = await userService.lockUsers(requestUser, [
      assessmentUser1.id,
    ]);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].error).toBeUndefined();
    expect(result[0].status).toBe("OK");
  });

  it("Should not lock accessor if its the only one on the organisation", async () => {
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
      AccessorOrganisationRole.ACCESSOR
    );

    const organisationUnit = await fixtures.createOrganisationUnit(
      accessorOrganisation
    );

    const organisationUnitAccessorUser = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationAccessorUser,
      organisationUnit
    );

    const requestUser = {
      id: "request_user_id",
      type: UserType.ADMIN,
    };

    const result = await userService.lockUsers(requestUser, [accessorUser.id]);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].error.code).toBe("LastAccessorUserOnOrganisationError");
  });

  it("Should not lock accessor if its the only one on the organisation unit", async () => {
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
      AccessorOrganisationRole.ACCESSOR
    );
    const organisationAccessorUser2 = await fixtures.addUserToOrganisation(
      accessorUser2,
      accessorOrganisation,
      AccessorOrganisationRole.ACCESSOR
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
      id: "request_user_id",
      type: UserType.ADMIN,
    };

    const result = await userService.lockUsers(requestUser, [accessorUser1.id]);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].error.code).toBe(
      "LastAccessorUserOnOrganisationUnitError"
    );
  });

  it("Should lock accessor if its NOT the only one on the organisation AND organisation unit", async () => {
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
      AccessorOrganisationRole.ACCESSOR
    );
    const organisationAccessorUser2 = await fixtures.addUserToOrganisation(
      accessorUser2,
      accessorOrganisation,
      AccessorOrganisationRole.ACCESSOR
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
      id: "request_user_id",
      type: UserType.ADMIN,
    };

    const result = await userService.lockUsers(requestUser, [accessorUser1.id]);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].error).toBeUndefined();
    expect(result[0].status).toBe("OK");
  });
});
