import { UserService } from "@services/services/User.service";
import {
  AccessorOrganisationRole,
  closeTestsConnection,
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

describe("[Admin Service unit activation suite", () => {
  let adminService: AdminService;
  beforeAll(async () => {
    //await setupTestsConnection();
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
    //await closeTestsConnection();
  });

  it("Should activate Organisation Unit if it has at least one Qualifying Accessor", async () => {
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
    jest.spyOn(UserService.prototype, "updateB2CUser").mockResolvedValue(true);
    

    const accessorUser1 = await fixtures.createAccessorUser();
   
    const accessorOrganisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );

    const organisationAccessorUser1 = await fixtures.addUserToOrganisation(
      accessorUser1,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );
  

    const organisationUnit1 = await fixtures.createOrganisationUnit(
      accessorOrganisation,
       { inactivatedAt: new Date()}
    );

    await fixtures.addOrganisationUserToOrganisationUnit(
      organisationAccessorUser1,
      organisationUnit1
    );
 

    const requestUser = {
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      externalId: 'C7095D87-C3DF-46F6-A503-001B083F4630',
      type: UserType.ADMIN,
    };

    const actual = await adminService.activateOrganisationUnit(requestUser, organisationUnit1.id)


    expect(actual).toBeDefined();
    expect(actual.status).toBe('OK');
  });

  it("Should not activate Organisation Unit if it does not have at least one Qualifying Accessor", async () => {
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
    jest.spyOn(UserService.prototype, "updateB2CUser").mockResolvedValue(true);
    

    const accessorUser1 = await fixtures.createAccessorUser();
   
    const accessorOrganisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );

    const organisationAccessorUser1 = await fixtures.addUserToOrganisation(
      accessorUser1,
      accessorOrganisation,
      AccessorOrganisationRole.ACCESSOR
    );
  

    const organisationUnit1 = await fixtures.createOrganisationUnit(
      accessorOrganisation,
       { inactivatedAt: new Date()}
    );

    await fixtures.addOrganisationUserToOrganisationUnit(
      organisationAccessorUser1,
      organisationUnit1
    );
 

    const requestUser = {
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      externalId: 'C7095D87-C3DF-46F6-A503-001B083F4630',
      type: UserType.ADMIN,
    };

    let err;

    try {
      await adminService.activateOrganisationUnit(requestUser, organisationUnit1.id)
      
    } catch (error) {
      err = error;      
    }


    expect(err).toBeDefined();
    expect(err.message).toContain('Missing at least one assigned Qualifying Accessor');
  });

  it("Should not activate Organisation Unit if it does not assigned users at all", async () => {
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
    jest.spyOn(UserService.prototype, "updateB2CUser").mockResolvedValue(true);
    
    const accessorOrganisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );

    const organisationUnit1 = await fixtures.createOrganisationUnit(
      accessorOrganisation,
       { inactivatedAt: new Date()}
    );

    const requestUser = {
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      externalId: 'C7095D87-C3DF-46F6-A503-001B083F4630',
      type: UserType.ADMIN,
    };

    let err;

    try {
      await adminService.activateOrganisationUnit(requestUser, organisationUnit1.id)
      
    } catch (error) {
      err = error;      
    }

    expect(err).toBeDefined();
    expect(err.message).toContain('Missing at least one assigned Qualifying Accessor');
  });
});
