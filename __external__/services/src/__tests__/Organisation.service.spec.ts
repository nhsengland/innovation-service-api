import {
  AccessorOrganisationRole,
  Organisation,
  OrganisationType,
  OrganisationUnit,
  OrganisationUser,
  User,
} from "@domain/index";
import { getConnection, Repository } from "typeorm";
import { AccessorService } from "../services/Accessor.service";
import { OrganisationService } from "../services/Organisation.service";
import * as faker from "faker";

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
    organisationService = new OrganisationService(process.env.DB_TESTS_NAME);
    accessorService = new AccessorService(process.env.DB_TESTS_NAME);
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();
    await query.from(OrganisationUser).execute();
    await query.from(OrganisationUnit).execute();
    await query.from(Organisation).execute();
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
      type: "accessor",
    };
    const actual = await organisationService.findAll(filter);

    expect(actual.length).toEqual(2);
  });

  it("should fail when findAll() without type", async () => {
    const filter = {
      aaa: "test",
    };

    let err;
    try {
      await organisationService.findAll(filter);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
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
});
