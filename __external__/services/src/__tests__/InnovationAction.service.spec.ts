import {
  AccessorOrganisationRole,
  Comment,
  Innovation,
  InnovationAction,
  InnovationActionStatus,
  InnovationSection,
  InnovationSectionCatalogue,
  InnovationSupport,
  Organisation,
  OrganisationType,
  OrganisationUnit,
  OrganisationUnitUser,
  OrganisationUser,
  User,
} from "@domain/index";
import { getConnection } from "typeorm";
import { closeTestsConnection, setupTestsConnection } from "..";
import * as helpers from "../helpers";
import { InnovationActionService } from "../services/InnovationAction.service";
import * as fixtures from "../__fixtures__";

describe("Innovation Action Suite", () => {
  let actionService: InnovationActionService;
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
    actionService = new InnovationActionService(process.env.DB_TESTS_NAME);

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

    qAccessorUserOrganisations = await fixtures.findUserOrganisations(
      qualAccessorUser.id
    );
    accessorUserOrganisations = await fixtures.findUserOrganisations(
      accessorUser.id
    );

    await fixtures.createSupportInInnovation(
      innovation,
      qualAccessorUser,
      qAccessorUserOrganisations[0],
      organisationQuaAccessorUnitUser
    );
    innovation = await fixtures.createSectionInInnovation(
      innovation,
      innovatorUser,
      InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      {}
    );

    spyOn(helpers, "authenticateWitGraphAPI").and.returnValue(":access_token");
    spyOn(helpers, "getUserFromB2C").and.returnValue({
      displayName: "Q Accessor A",
    });
    spyOn(helpers, "getUsersFromB2C").and.returnValues([
      { id: accessorUser.id, displayName: ":ACCESSOR" },
      { id: qualAccessorUser.id, displayName: ":QUALIFYING_ACCESSOR" },
    ]);
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(InnovationSupport).execute();
    await query.from(OrganisationUnitUser).execute();
    await query.from(OrganisationUnit).execute();
    await query.from(OrganisationUser).execute();
    await query.from(Organisation).execute();
    await query.from(InnovationSection).execute();
    await query.from(Innovation).execute();
    await query.from(User).execute();

    // closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(Comment).execute();
    await query.from(InnovationAction).execute();
  });

  it("should create an action in an existing section", async () => {
    const actionObj = {
      description: "missing good descriptions",
      section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
    };

    const item = await actionService.create(
      qualAccessorUser.id,
      innovation.id,
      actionObj,
      qAccessorUserOrganisations
    );

    expect(item).toBeDefined();
    expect(item.status).toEqual(InnovationActionStatus.REQUESTED);
  });

  it("should create an action in a non-existing section", async () => {
    const actionObj = {
      description: "missing good descriptions",
      section: InnovationSectionCatalogue.CURRENT_CARE_PATHWAY,
    };

    const item = await actionService.create(
      qualAccessorUser.id,
      innovation.id,
      actionObj,
      qAccessorUserOrganisations
    );

    expect(item).toBeDefined();
    expect(item.status).toEqual(InnovationActionStatus.REQUESTED);
  });

  it("should update an action by accessor", async () => {
    const actionCreateObj = {
      description: "missing good descriptions",
      section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
    };

    const action = await actionService.create(
      qualAccessorUser.id,
      innovation.id,
      actionCreateObj,
      qAccessorUserOrganisations
    );

    const actionUpdObj = {
      status: InnovationActionStatus.DELETED,
      comment: "new comment",
    };
    const item = await actionService.update(
      action.id,
      qualAccessorUser.id,
      innovation.id,
      actionUpdObj,
      qAccessorUserOrganisations
    );

    expect(item).toBeDefined();
    expect(item.status).toEqual(InnovationActionStatus.DELETED);
  });
});
