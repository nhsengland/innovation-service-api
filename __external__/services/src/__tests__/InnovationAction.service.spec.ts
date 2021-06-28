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
import {
  InvalidParamsError,
  MissingUserOrganisationError,
} from "@services/errors";
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
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
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
    expect(item.displayId).toEqual("CP01");
    expect(item.status).toEqual(InnovationActionStatus.REQUESTED);
  });

  it("should throw when create with invalid params", async () => {
    let err;
    try {
      await actionService.create(null, null, null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
    expect(err.message).toContain("Invalid parameters.");
  });

  it("should throw when create without user organisations", async () => {
    let err;
    try {
      await actionService.create("a", "a", {}, []);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(MissingUserOrganisationError);
    expect(err.message).toContain("Invalid user. User has no organisations.");
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
    const item = await actionService.updateByAccessor(
      action.id,
      qualAccessorUser.id,
      innovation.id,
      actionUpdObj,
      qAccessorUserOrganisations
    );

    expect(item).toBeDefined();
    expect(item.status).toEqual(InnovationActionStatus.DELETED);
  });

  it("should throw when accessor update with invalid params", async () => {
    let err;
    try {
      await actionService.updateByAccessor(null, null, null, null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
    expect(err.message).toContain("Invalid parameters.");
  });

  it("should throw when accessor update without user organisations", async () => {
    let err;
    try {
      await actionService.updateByAccessor("a", "a", "a", {}, []);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(MissingUserOrganisationError);
    expect(err.message).toContain("Invalid user. User has no organisations.");
  });

  it("should update an action by innovator", async () => {
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
      status: InnovationActionStatus.DECLINED,
      comment: "new comment",
    };
    const item = await actionService.updateByInnovator(
      action.id,
      innovatorUser.id,
      innovation.id,
      actionUpdObj
    );

    expect(item).toBeDefined();
    expect(item.status).toEqual(InnovationActionStatus.DECLINED);
  });

  it("should throw when innovator update with invalid params", async () => {
    let err;
    try {
      await actionService.updateByInnovator(null, null, null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
    expect(err.message).toContain("Invalid parameters.");
  });

  it("should find all innovation actions if Innovator", async () => {
    await actionService.create(
      qualAccessorUser.id,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      },
      qAccessorUserOrganisations
    );

    await actionService.create(
      qualAccessorUser.id,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.MARKET_RESEARCH,
      },
      qAccessorUserOrganisations
    );

    const item = await actionService.findAllByInnovation(
      innovatorUser.id,
      innovation.id,
      null
    );

    expect(item).toBeDefined();
    expect(item.length).toEqual(2);
  });

  it("should find all innovation actions if Accessor in a support unit", async () => {
    await actionService.create(
      qualAccessorUser.id,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      },
      qAccessorUserOrganisations
    );

    await actionService.create(
      qualAccessorUser.id,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.MARKET_RESEARCH,
      },
      qAccessorUserOrganisations
    );

    const item = await actionService.findAllByInnovation(
      accessorUser.id,
      innovation.id,
      accessorUserOrganisations
    );

    expect(item).toBeDefined();
    expect(item.length).toEqual(2);
  });

  it("should find all innovation actions if Q. Accessor in a shared organisation", async () => {
    await actionService.create(
      qualAccessorUser.id,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      },
      qAccessorUserOrganisations
    );

    await actionService.create(
      qualAccessorUser.id,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.MARKET_RESEARCH,
      },
      qAccessorUserOrganisations
    );

    const item = await actionService.findAllByInnovation(
      qualAccessorUser.id,
      innovation.id,
      qAccessorUserOrganisations
    );

    expect(item).toBeDefined();
    expect(item.length).toEqual(2);
  });

  it("should find one innovation action if Innovator by ID", async () => {
    const action = await actionService.create(
      qualAccessorUser.id,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      },
      qAccessorUserOrganisations
    );

    const item = await actionService.find(
      action.id,
      innovatorUser.id,
      innovation.id
    );

    expect(item).toBeDefined();
    expect(item.id).toEqual(action.id);
  });

  it("should find one innovation action if Accessor in a support unit by ID", async () => {
    const action = await actionService.create(
      qualAccessorUser.id,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      },
      qAccessorUserOrganisations
    );

    const item = await actionService.find(
      action.id,
      accessorUser.id,
      innovation.id,
      accessorUserOrganisations
    );

    expect(item).toBeDefined();
    expect(item.id).toEqual(action.id);
  });

  it("should find one innovation action if Q. Accessor in a shared organisation by ID", async () => {
    const action = await actionService.create(
      qualAccessorUser.id,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      },
      qAccessorUserOrganisations
    );

    const item = await actionService.find(
      action.id,
      qualAccessorUser.id,
      innovation.id,
      qAccessorUserOrganisations
    );

    expect(item).toBeDefined();
    expect(item.id).toEqual(action.id);
  });

  it("should find all open actions if Qual. Accessor", async () => {
    await actionService.create(
      qualAccessorUser.id,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      },
      qAccessorUserOrganisations
    );

    await actionService.create(
      qualAccessorUser.id,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.MARKET_RESEARCH,
      },
      qAccessorUserOrganisations
    );

    const item = await actionService.findAllByAccessor(
      qualAccessorUser.id,
      qAccessorUserOrganisations,
      true,
      0,
      10
    );

    expect(item).toBeDefined();
    expect(item.count).toEqual(2);
  });

  it("should find all open actions if Qual. Accessor with column order", async () => {
    await actionService.create(
      qualAccessorUser.id,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      },
      qAccessorUserOrganisations
    );

    await actionService.create(
      qualAccessorUser.id,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.MARKET_RESEARCH,
      },
      qAccessorUserOrganisations
    );

    const item = await actionService.findAllByAccessor(
      qualAccessorUser.id,
      qAccessorUserOrganisations,
      true,
      0,
      10,
      {
        createdAt: "ASC",
        innovationName: "ASC",
        section: "ASC",
        status: "DESC",
      }
    );

    expect(item).toBeDefined();
    expect(item.count).toEqual(2);
  });

  it("should find all open actions if Accessor", async () => {
    await actionService.create(
      qualAccessorUser.id,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      },
      qAccessorUserOrganisations
    );

    await actionService.create(
      qualAccessorUser.id,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.MARKET_RESEARCH,
      },
      qAccessorUserOrganisations
    );

    const item = await actionService.findAllByAccessor(
      accessorUser.id,
      accessorUserOrganisations,
      true,
      0,
      10
    );

    expect(item).toBeDefined();
    expect(item.count).toEqual(2);
  });

  it("should find all close actions if Qual. Accessor", async () => {
    const action = await actionService.create(
      qualAccessorUser.id,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      },
      qAccessorUserOrganisations
    );
    await actionService.updateByAccessor(
      action.id,
      qualAccessorUser.id,
      innovation.id,
      {
        status: InnovationActionStatus.COMPLETED,
      },
      qAccessorUserOrganisations
    );

    await actionService.create(
      qualAccessorUser.id,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.MARKET_RESEARCH,
      },
      qAccessorUserOrganisations
    );

    const item = await actionService.findAllByAccessor(
      qualAccessorUser.id,
      qAccessorUserOrganisations,
      false,
      0,
      10
    );

    expect(item).toBeDefined();
    expect(item.count).toEqual(1);
  });

  it("should find all close actions if Accessor", async () => {
    const action = await actionService.create(
      qualAccessorUser.id,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      },
      qAccessorUserOrganisations
    );
    await actionService.updateByAccessor(
      action.id,
      qualAccessorUser.id,
      innovation.id,
      {
        status: InnovationActionStatus.COMPLETED,
      },
      qAccessorUserOrganisations
    );

    await actionService.create(
      qualAccessorUser.id,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.MARKET_RESEARCH,
      },
      qAccessorUserOrganisations
    );

    const item = await actionService.findAllByAccessor(
      accessorUser.id,
      accessorUserOrganisations,
      false,
      0,
      10
    );

    expect(item).toBeDefined();
    expect(item.count).toEqual(1);
  });
});
