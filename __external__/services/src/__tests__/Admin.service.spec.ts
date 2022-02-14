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
  UserRole,
  UserType,
} from "..";
import * as fixtures from "../__fixtures__";
import * as dotenv from "dotenv";
import * as path from "path";
import * as helpers from "../helpers";
import { getConnection } from "typeorm";
import { AdminService } from "@services/services/Admin.service";
import { InvalidDataError } from "@services/errors";

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

    const result = await adminService.userLockValidation(assessmentUser.id);

    expect(result).toBeDefined();
    expect(result.lastAssessmentUserOnPlatform.valid).toBe(false);
    expect(result.lastAccessorUserOnOrganisation.valid).toBe(true);
    expect(result.lastAccessorUserOnOrganisationUnit.valid).toBe(true);
    expect(result.lastAccessorFromUnitProvidingSupport.valid).toBe(true);
  });

  it("Should not lock User if is last assessment user when there other locked users", async () => {
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
    await fixtures.createAssessmentUser(new Date());
    await fixtures.createAssessmentUser(new Date());
    const assessmentUser = await fixtures.createAssessmentUser();
    const requestUser = {
      id: "request_user_id",
      type: UserType.ADMIN,
    };
    // Act

    const result = await adminService.userLockValidation(assessmentUser.id);

    expect(result).toBeDefined();
    expect(result.lastAssessmentUserOnPlatform.valid).toBe(false);
    expect(result.lastAccessorUserOnOrganisation.valid).toBe(true);
    expect(result.lastAccessorUserOnOrganisationUnit.valid).toBe(true);
    expect(result.lastAccessorFromUnitProvidingSupport.valid).toBe(true);
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

    const result = await adminService.lockUsers(
      requestUser,
      assessmentUser1.id
    );

    expect(result.error).toBeUndefined();
    expect(result.status).toBe("OK");
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
      id: "request_user_id",
      type: UserType.ADMIN,
    };

    const result = await adminService.userLockValidation(accessorUser.id);

    expect(result).toBeDefined();
    expect(result.lastAssessmentUserOnPlatform.valid).toBe(true);
    expect(result.lastAccessorUserOnOrganisation.valid).toBe(false);
    expect(result.lastAccessorUserOnOrganisationUnit.valid).toBe(true);
    expect(result.lastAccessorFromUnitProvidingSupport.valid).toBe(true);
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
      id: "request_user_id",
      type: UserType.ADMIN,
    };

    jest.spyOn(UserService.prototype, "updateB2CUser").mockResolvedValue(true);

    const result = await adminService.userLockValidation(accessorUser1.id);

    expect(result).toBeDefined();
    expect(result.lastAssessmentUserOnPlatform.valid).toBe(true);
    expect(result.lastAccessorUserOnOrganisation.valid).toBe(true);
    expect(result.lastAccessorUserOnOrganisationUnit.valid).toBe(false);
    expect(result.lastAccessorFromUnitProvidingSupport.valid).toBe(true);
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
      id: "request_user_id",
      type: UserType.ADMIN,
    };

    const result = await adminService.userLockValidation(accessorUser1.id);

    expect(result).toBeDefined();
    expect(result.lastAssessmentUserOnPlatform.valid).toBe(true);
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
      type: UserType.ADMIN,
    };

    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");

    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue(true);

    jest.spyOn(helpers, "createB2CUser").mockResolvedValue({
      id: "user_id_from_b2c",
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
      id: "request_user_id",
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
      type: UserType.ADMIN,
    };

    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");

    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue(false);

    jest.spyOn(helpers, "createB2CUser").mockResolvedValue({
      id: "user_id_from_b2c",
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
      id: "request_user_id",
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
    expect(result.id).toBeDefined();
    expect(result.status).toBe("OK");
  });
});
