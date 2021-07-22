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
  InvalidParamsError,
  InvalidUserRoleError,
  MissingUserOrganisationError,
} from "@services/errors";
import * as faker from "faker";
import { getConnection } from "typeorm";
import { closeTestsConnection, setupTestsConnection } from "..";
import * as helpers from "../helpers";
import { AccessorService } from "../services/Accessor.service";
import { OrganisationService } from "../services/Organisation.service";
import * as fixtures from "../__fixtures__";
import * as dotenv from "dotenv";
import * as path from "path";
const dummy = {
  baseOrganisation: {
    name: "my org name",
    size: "huge",
  },
};
describe("Organisation Service Suite", () => {
  let organisationService: OrganisationService;
  let accessorService: AccessorService;

  beforeAll(async () => {
    // await setupTestsConnection();

    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });
    organisationService = new OrganisationService(process.env.DB_TESTS_NAME);
    accessorService = new AccessorService(process.env.DB_TESTS_NAME);
  });

  afterAll(async () => {
    // closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(OrganisationUnitUser).execute();
    await query.from(OrganisationUser).execute();
    await query.from(OrganisationUnit).execute();
    await query.from(Organisation).execute();
    await query.from(User).execute();
  });

  it("should instantiate the organisation service", async () => {
    expect(organisationService).toBeDefined();
  });

  it("should create an accessor organisation when create()", async () => {
    const organisation = Organisation.new({
      ...dummy.baseOrganisation,
      type: OrganisationType.ACCESSOR,
    });

    const item = await organisationService.create(organisation);

    expect(item.id).toEqual(organisation.id);
  });

  it("should create an innovator organisation when create()", async () => {
    const organisation = Organisation.new({
      ...dummy.baseOrganisation,
      type: OrganisationType.INNOVATOR,
    });

    const item = await organisationService.create(organisation);

    expect(item.id).toEqual(organisation.id);
  });

  it("should throw when findAll() with invalid params", async () => {
    let err;
    try {
      await organisationService.findAll(null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should return all accessor organisations when findAll() with type accessor", async () => {
    let organisation = Organisation.new({
      ...dummy.baseOrganisation,
      type: OrganisationType.ACCESSOR,
    });
    await organisationService.create(organisation);

    organisation = Organisation.new({
      name: "MyOrg2",
      size: "huge too",
      type: OrganisationType.ACCESSOR,
    });
    await organisationService.create(organisation);

    const filter = {
      type: OrganisationType.ACCESSOR,
    };
    const actual = await organisationService.findAll(filter);

    expect(actual.length).toEqual(2);
  });

  it("should return all user organisations when findUserOrganisations()", async () => {
    const organisationObj = Organisation.new({
      ...dummy.baseOrganisation,
      type: OrganisationType.ACCESSOR,
    });
    const organisation = await organisationService.create(organisationObj);

    const accessorObj = User.new({
      id: "abc-def-ghi",
    });
    const accessor = await accessorService.create(accessorObj);
    await organisationService.addUserToOrganisation(
      accessor,
      organisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );

    const actual = await organisationService.findUserOrganisations(accessor.id);

    expect(actual.length).toEqual(1);
  });

  it("should add organisation unit to organisation", async () => {
    const organisationObj = Organisation.new({
      ...dummy.baseOrganisation,
      type: OrganisationType.ACCESSOR,
    });
    const organisation = await organisationService.create(organisationObj);

    const name = faker.company.companySuffix();
    const unitObj = OrganisationUnit.new({
      name,
      organisation,
    });

    const unit = await organisationService.addOrganisationUnit(unitObj);

    expect(unit).toBeDefined();
    expect(unit.name).toBe(name);
  });

  it("should throw when findUserOrganisationUnitUsers() with invalid params", async () => {
    let err;
    try {
      await organisationService.findUserOrganisationUnitUsers(null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when findUserOrganisationUnitUsers() without user organisations", async () => {
    let err;
    try {
      await organisationService.findUserOrganisationUnitUsers({
        id: ":id",
        type: UserType.ACCESSOR,
      });
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(MissingUserOrganisationError);
  });

  it("should throw when findUserOrganisationUnitUsers() with user organisation role", async () => {
    let err;
    try {
      await organisationService.findUserOrganisationUnitUsers({
        id: ":id",
        type: UserType.ACCESSOR,
        organisationUser: {
          id: ":orgUId",
          role: AccessorOrganisationRole.ACCESSOR,
          organisation: {
            id: ":orgId",
            name: ":orgName",
          },
        },
        organisationUnitUser: {
          id: ":orgUnitId",
          organisationUnit: {
            id: ":orgUnitId",
            name: ":orgUnitName",
          },
        },
      });
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidUserRoleError);
  });

  it("should return organisation unit users by q. accessor units", async () => {
    spyOn(helpers, "authenticateWitGraphAPI").and.stub();
    spyOn(helpers, "getUsersFromB2C").and.returnValues([
      { id: "abc-def-ghi", displayName: ":ACCESSOR" },
      { id: "ttt-aaa-ddd", displayName: ":QUALIFYING_ACCESSOR" },
    ]);

    const organisationObj = Organisation.new({
      ...dummy.baseOrganisation,
      type: OrganisationType.ACCESSOR,
    });
    const organisation = await organisationService.create(organisationObj);

    const unitObj = OrganisationUnit.new({
      name: "newUnit",
      organisation,
    });
    const unit = await organisationService.addOrganisationUnit(unitObj);

    const accessor = await accessorService.create(
      User.new({
        id: "abc-def-ghi",
        type: UserType.ACCESSOR,
      })
    );

    const qaccessor = await accessorService.create(
      User.new({
        id: "ttt-aaa-ddd",
        type: UserType.ACCESSOR,
      })
    );

    let orgUser = await organisationService.addUserToOrganisation(
      accessor,
      organisation,
      AccessorOrganisationRole.ACCESSOR
    );
    await organisationService.addUserToOrganisationUnit(orgUser, unit);

    orgUser = await organisationService.addUserToOrganisation(
      qaccessor,
      organisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );
    const orgUnitUser = await organisationService.addUserToOrganisationUnit(
      orgUser,
      unit
    );

    const result = await organisationService.findUserOrganisationUnitUsers(
      fixtures.getRequestUser(qaccessor, orgUser, orgUnitUser)
    );

    expect(result).toBeDefined();
    expect(result.length).toEqual(2);
  });

  it("should return organisation unit users", async () => {
    spyOn(helpers, "authenticateWitGraphAPI").and.stub();
    spyOn(helpers, "getUsersFromB2C").and.returnValues([
      { id: "abc-def-ghi", displayName: ":ACCESSOR" },
      { id: "ttt-aaa-ddd", displayName: ":QUALIFYING_ACCESSOR" },
    ]);

    const organisationObj = Organisation.new({
      ...dummy.baseOrganisation,
      type: OrganisationType.ACCESSOR,
    });
    const organisation = await organisationService.create(organisationObj);

    let unitObj = OrganisationUnit.new({
      name: "newUnit",
      organisation,
    });
    await organisationService.addOrganisationUnit(unitObj);

    unitObj = OrganisationUnit.new({
      name: "newUnit2",
      organisation,
    });
    await organisationService.addOrganisationUnit(unitObj);

    const result = await organisationService.findAllWithOrganisationUnits();

    expect(result).toBeDefined();
    expect(result.length).toEqual(1);
    expect(result[0].organisationUnits.length).toEqual(2);
  });
});
