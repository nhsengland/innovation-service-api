import {
  AccessorOrganisationRole,
  Comment,
  Innovation,
  InnovationSupport,
  InnovationSupportStatus,
  Organisation,
  OrganisationType,
  OrganisationUnit,
  OrganisationUnitUser,
  OrganisationUser,
  User,
} from "@domain/index";
import { AccessorService } from "@services/services/Accessor.service";
import { OrganisationService } from "@services/services/Organisation.service";
import { UserService } from "@services/services/User.service";
import { getConnection } from "typeorm";
import { closeTestsConnection, setupTestsConnection } from "..";
import * as helpers from "../helpers";
import { InnovationService } from "../services/Innovation.service";
import { InnovationSupportService } from "../services/InnovationSupport.service";
import { InnovatorService } from "../services/Innovator.service";

const dummy = {
  qAccessorId: "qAccessorId",
  accessorId: "accessorId",
  innovatorId: "innovatorId",
};

describe("Innovation Support Suite", () => {
  let supportService: InnovationSupportService;
  let userService: UserService;
  let innovation: Innovation;
  let organisationQuaAccessorUnitUser: OrganisationUnitUser;
  let organisationAccessorUnitUser: OrganisationUnitUser;
  let qAccessorUserOrganisations: OrganisationUser[];
  let accessorUserOrganisations: OrganisationUser[];

  beforeAll(async () => {
    // await setupTestsConnection();
    const accessorService = new AccessorService(process.env.DB_TESTS_NAME);
    const innovationService = new InnovationService(process.env.DB_TESTS_NAME);
    const innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
    const organisationService = new OrganisationService(
      process.env.DB_TESTS_NAME
    );

    supportService = new InnovationSupportService(process.env.DB_TESTS_NAME);
    userService = new UserService(process.env.DB_TESTS_NAME);

    const innovator = new User();
    innovator.id = dummy.innovatorId;
    const innovatorUser = await innovatorService.create(innovator);

    const qualAccessor = new User();
    qualAccessor.id = dummy.qAccessorId;
    const qualAccessorUser = await accessorService.create(qualAccessor);

    const accessor = new User();
    accessor.id = dummy.accessorId;
    const accessorUser = await accessorService.create(accessor);

    const organisationObj = Organisation.new({
      name: "my org name",
      type: OrganisationType.ACCESSOR,
    });
    const accessorOrganisation = await organisationService.create(
      organisationObj
    );
    const organisationQuaAccessorUser = await organisationService.addUserToOrganisation(
      qualAccessorUser,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );

    const organisationAccessorUser = await organisationService.addUserToOrganisation(
      accessorUser,
      accessorOrganisation,
      AccessorOrganisationRole.ACCESSOR
    );

    const orgUnit = OrganisationUnit.new({
      name: "org Unit",
      organisation: accessorOrganisation,
    });
    const organisationUnit = await organisationService.addOrganisationUnit(
      orgUnit
    );
    organisationQuaAccessorUnitUser = await organisationService.addUserToOrganisationUnit(
      organisationQuaAccessorUser,
      organisationUnit
    );
    organisationAccessorUnitUser = await organisationService.addUserToOrganisationUnit(
      organisationAccessorUser,
      organisationUnit
    );

    const innovationObj = Innovation.new({
      owner: innovatorUser,
      surveyId: "abc",
      name: "My Innovation",
      description: "My Description",
      countryName: "UK",
      organisationShares: [{ id: accessorOrganisation.id }],
    });

    innovation = await innovationService.create(innovationObj);
    spyOn(helpers, "authenticateWitGraphAPI").and.returnValue(":access_token");
    spyOn(helpers, "getUserFromB2C").and.returnValue({
      displayName: "Q Accessor A",
    });
    spyOn(helpers, "getUsersFromB2C").and.returnValues([
      { id: dummy.accessorId, displayName: ":ACCESSOR" },
      { id: dummy.qAccessorId, displayName: ":QUALIFYING_ACCESSOR" },
    ]);

    qAccessorUserOrganisations = await organisationService.findUserOrganisations(
      qualAccessor.id
    );
    accessorUserOrganisations = await organisationService.findUserOrganisations(
      accessor.id
    );
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(OrganisationUnitUser).execute();
    await query.from(OrganisationUnit).execute();
    await query.from(OrganisationUser).execute();
    await query.from(Organisation).execute();
    await query.from(Innovation).execute();
    await query.from(User).execute();

    // closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(Comment).execute();
    await query.from(InnovationSupport).execute();
  });

  it("should create an support", async () => {
    const supportObj = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [organisationAccessorUnitUser.id],
      comment: "test comment",
    };

    const item = await supportService.create(
      dummy.qAccessorId,
      innovation.id,
      supportObj,
      qAccessorUserOrganisations
    );

    expect(item).toBeDefined();
    expect(item.status).toEqual(InnovationSupportStatus.ENGAGING);
  });

  it("should find an support by innovator", async () => {
    const supportObj = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [organisationAccessorUnitUser.id],
    };

    const support = await supportService.create(
      dummy.qAccessorId,
      innovation.id,
      supportObj,
      qAccessorUserOrganisations
    );

    const item = await supportService.find(
      support.id,
      dummy.innovatorId,
      innovation.id,
      null
    );

    expect(item).toBeDefined();
    expect(item.status).toEqual(InnovationSupportStatus.ENGAGING);
    expect(item.accessors.length).toEqual(1);
  });

  it("should find an support by q. accessor", async () => {
    const supportObj = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [organisationAccessorUnitUser.id],
    };

    const support = await supportService.create(
      dummy.qAccessorId,
      innovation.id,
      supportObj,
      qAccessorUserOrganisations
    );

    const item = await supportService.find(
      support.id,
      dummy.qAccessorId,
      innovation.id,
      qAccessorUserOrganisations
    );

    expect(item).toBeDefined();
    expect(item.status).toEqual(InnovationSupportStatus.ENGAGING);
    expect(item.accessors.length).toEqual(1);
  });

  it("should find an support by accessor", async () => {
    const supportObj = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [organisationAccessorUnitUser.id],
    };

    const support = await supportService.create(
      dummy.qAccessorId,
      innovation.id,
      supportObj,
      qAccessorUserOrganisations
    );

    const item = await supportService.find(
      support.id,
      dummy.accessorId,
      innovation.id,
      accessorUserOrganisations
    );

    expect(item).toBeDefined();
    expect(item.status).toEqual(InnovationSupportStatus.ENGAGING);
    expect(item.accessors.length).toEqual(1);
  });

  it("should update an support status to add one accessor", async () => {
    let supportObj = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [organisationAccessorUnitUser.id],
      comment: "test comment",
    };

    const support = await supportService.create(
      dummy.qAccessorId,
      innovation.id,
      supportObj,
      qAccessorUserOrganisations
    );

    supportObj = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [
        organisationAccessorUnitUser.id,
        organisationQuaAccessorUnitUser.id,
      ],
      comment: "test comment 2",
    };
    await supportService.update(
      support.id,
      dummy.qAccessorId,
      innovation.id,
      supportObj,
      qAccessorUserOrganisations
    );

    const item = await supportService.find(
      support.id,
      dummy.innovatorId,
      innovation.id
    );

    expect(item).toBeDefined();
    expect(item.status).toEqual(InnovationSupportStatus.ENGAGING);
    expect(item.accessors.length).toEqual(2);
  });

  it("should update an support status to a non engaging status", async () => {
    let supportObj = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [organisationAccessorUnitUser.id],
      comment: "test comment",
    };

    const support = await supportService.create(
      dummy.qAccessorId,
      innovation.id,
      supportObj,
      qAccessorUserOrganisations
    );

    supportObj = {
      status: InnovationSupportStatus.NOT_YET,
      accessors: [
        organisationAccessorUnitUser.id,
        organisationQuaAccessorUnitUser.id,
      ],
      comment: null,
    };
    await supportService.update(
      support.id,
      dummy.qAccessorId,
      innovation.id,
      supportObj,
      qAccessorUserOrganisations
    );

    const item = await supportService.find(
      support.id,
      dummy.innovatorId,
      innovation.id
    );

    expect(item).toBeDefined();
    expect(item.status).toEqual(InnovationSupportStatus.NOT_YET);
    expect(item.accessors.length).toEqual(0);
  });
});
