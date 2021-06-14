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
import { UserService } from "@services/services/User.service";
import { getConnection } from "typeorm";
import { closeTestsConnection, setupTestsConnection } from "..";
import * as helpers from "../helpers";
import { InnovationSupportService } from "../services/InnovationSupport.service";
import * as fixtures from "../__fixtures__";

describe("Innovation Support Suite", () => {
  let supportService: InnovationSupportService;
  let innovation: Innovation;
  let innovatorUser: User;
  let accessorUser: User;
  let qualAccessorUser: User;
  let organisationQuaAccessorUnitUser: OrganisationUnitUser;
  let organisationAccessorUnitUser: OrganisationUnitUser;
  let qAccessorUserOrganisations: OrganisationUser[];
  let accessorUserOrganisations: OrganisationUser[];

  beforeAll(async () => {
    // await setupTestsConnection();
    supportService = new InnovationSupportService(process.env.DB_TESTS_NAME);

    innovatorUser = await fixtures.createInnovatorUser();
    qualAccessorUser = await fixtures.createAccessorUser();
    accessorUser = await fixtures.createAccessorUser();

    const accessorOrganisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );
    const organisationQuaAccessorUser = await fixtures.addUserToOrganisation(
      qualAccessorUser,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );
    const organisationAccessorUser = await fixtures.addUserToOrganisation(
      accessorUser,
      accessorOrganisation,
      AccessorOrganisationRole.ACCESSOR
    );

    const organisationUnit = await fixtures.createOrganisationUnit(
      accessorOrganisation
    );
    organisationQuaAccessorUnitUser = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationQuaAccessorUser,
      organisationUnit
    );
    organisationAccessorUnitUser = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationAccessorUser,
      organisationUnit
    );

    const innovationObj = fixtures.generateInnovation({
      owner: innovatorUser,
      surveyId: "abc",
      organisationShares: [{ id: accessorOrganisation.id }],
    });
    const innovations = await fixtures.saveInnovations(innovationObj);
    innovation = innovations[0];

    spyOn(helpers, "authenticateWitGraphAPI").and.returnValue(":access_token");
    spyOn(helpers, "getUserFromB2C").and.returnValue({
      displayName: "Q Accessor A",
    });
    spyOn(helpers, "getUsersFromB2C").and.returnValues([
      { id: accessorUser.id, displayName: ":ACCESSOR" },
      { id: qualAccessorUser.id, displayName: ":QUALIFYING_ACCESSOR" },
    ]);

    qAccessorUserOrganisations = await fixtures.findUserOrganisations(
      qualAccessorUser.id
    );
    accessorUserOrganisations = await fixtures.findUserOrganisations(
      accessorUser.id
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
      qualAccessorUser.id,
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
      qualAccessorUser.id,
      innovation.id,
      supportObj,
      qAccessorUserOrganisations
    );

    const item = await supportService.find(
      support.id,
      innovatorUser.id,
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
      qualAccessorUser.id,
      innovation.id,
      supportObj,
      qAccessorUserOrganisations
    );

    const item = await supportService.find(
      support.id,
      qualAccessorUser.id,
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
      qualAccessorUser.id,
      innovation.id,
      supportObj,
      qAccessorUserOrganisations
    );

    const item = await supportService.find(
      support.id,
      accessorUser.id,
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
      qualAccessorUser.id,
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
      qualAccessorUser.id,
      innovation.id,
      supportObj,
      qAccessorUserOrganisations
    );

    const item = await supportService.find(
      support.id,
      innovatorUser.id,
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
      qualAccessorUser.id,
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
      qualAccessorUser.id,
      innovation.id,
      supportObj,
      qAccessorUserOrganisations
    );

    const item = await supportService.find(
      support.id,
      innovatorUser.id,
      innovation.id
    );

    expect(item).toBeDefined();
    expect(item.status).toEqual(InnovationSupportStatus.NOT_YET);
    expect(item.accessors.length).toEqual(0);
  });
});
