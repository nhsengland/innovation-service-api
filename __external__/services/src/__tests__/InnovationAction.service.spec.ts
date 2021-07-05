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
  UserType,
} from "@domain/index";
import {
  InvalidParamsError,
  MissingUserOrganisationError,
} from "@services/errors";
import { RequestUser } from "@services/models/RequestUser";
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

  let innovatorRequestUser: RequestUser;
  let accessorRequestUser: RequestUser;
  let qAccessorRequestUser: RequestUser;

  beforeAll(async () => {
    // await setupTestsConnection();
    actionService = new InnovationActionService(process.env.DB_TESTS_NAME);

    innovatorUser = await fixtures.createInnovatorUser();
    qualAccessorUser = await fixtures.createAccessorUser();
    accessorUser = await fixtures.createAccessorUser();

    const accessorOrganisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );
    const organisationQAccessorUser = await fixtures.addUserToOrganisation(
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
    const organisationUnitQAccessorUser =
      await fixtures.addOrganisationUserToOrganisationUnit(
        organisationQAccessorUser,
        organisationUnit
      );
    const organisationUnitAccessorUser =
      await fixtures.addOrganisationUserToOrganisationUnit(
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

    innovatorRequestUser = fixtures.getRequestUser(innovatorUser);
    qAccessorRequestUser = fixtures.getRequestUser(
      qualAccessorUser,
      organisationQAccessorUser,
      organisationUnitQAccessorUser
    );
    accessorRequestUser = fixtures.getRequestUser(
      accessorUser,
      organisationAccessorUser,
      organisationUnitAccessorUser
    );

    await fixtures.createSupportInInnovation(
      qAccessorRequestUser,
      innovation,
      qAccessorRequestUser.organisationUnitUser.id
    );
    innovation = await fixtures.createSectionInInnovation(
      innovatorRequestUser,
      innovation,
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
      qAccessorRequestUser,
      innovation.id,
      actionObj
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
      qAccessorRequestUser,
      innovation.id,
      actionObj
    );

    expect(item).toBeDefined();
    expect(item.displayId).toEqual("CP01");
    expect(item.status).toEqual(InnovationActionStatus.REQUESTED);
  });

  it("should throw when create with invalid params", async () => {
    let err;
    try {
      await actionService.create(null, null, null);
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
      await actionService.create(
        { id: ":id", type: UserType.ACCESSOR },
        "a",
        {}
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(MissingUserOrganisationError);
  });

  it("should update an action by accessor", async () => {
    const actionCreateObj = {
      description: "missing good descriptions",
      section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
    };

    const action = await actionService.create(
      qAccessorRequestUser,
      innovation.id,
      actionCreateObj
    );

    const actionUpdObj = {
      status: InnovationActionStatus.DELETED,
      comment: "new comment",
    };
    const item = await actionService.updateByAccessor(
      qAccessorRequestUser,
      action.id,
      innovation.id,
      actionUpdObj
    );

    expect(item).toBeDefined();
    expect(item.status).toEqual(InnovationActionStatus.DELETED);
  });

  it("should throw when accessor update with invalid params", async () => {
    let err;
    try {
      await actionService.updateByAccessor(null, null, null, null);
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
      await actionService.updateByAccessor(
        { id: ":id", type: UserType.ACCESSOR },
        "a",
        "a",
        {}
      );
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
      qAccessorRequestUser,
      innovation.id,
      actionCreateObj
    );

    const actionUpdObj = {
      status: InnovationActionStatus.DECLINED,
      comment: "new comment",
    };
    const item = await actionService.updateByInnovator(
      innovatorRequestUser,
      action.id,
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
    await actionService.create(qAccessorRequestUser, innovation.id, {
      description: "missing good descriptions",
      section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
    });

    await actionService.create(qAccessorRequestUser, innovation.id, {
      description: "missing good descriptions",
      section: InnovationSectionCatalogue.MARKET_RESEARCH,
    });

    const item = await actionService.findAllByInnovation(
      innovatorRequestUser,
      innovation.id
    );

    expect(item).toBeDefined();
    expect(item.length).toEqual(2);
  });

  it("should find all innovation actions if Accessor in a support unit", async () => {
    await actionService.create(qAccessorRequestUser, innovation.id, {
      description: "missing good descriptions",
      section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
    });

    await actionService.create(qAccessorRequestUser, innovation.id, {
      description: "missing good descriptions",
      section: InnovationSectionCatalogue.MARKET_RESEARCH,
    });

    const item = await actionService.findAllByInnovation(
      accessorRequestUser,
      innovation.id
    );

    expect(item).toBeDefined();
    expect(item.length).toEqual(2);
  });

  it("should find all innovation actions if Q. Accessor in a shared organisation", async () => {
    await actionService.create(qAccessorRequestUser, innovation.id, {
      description: "missing good descriptions",
      section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
    });

    await actionService.create(qAccessorRequestUser, innovation.id, {
      description: "missing good descriptions",
      section: InnovationSectionCatalogue.MARKET_RESEARCH,
    });

    const item = await actionService.findAllByInnovation(
      qAccessorRequestUser,
      innovation.id
    );

    expect(item).toBeDefined();
    expect(item.length).toEqual(2);
  });

  it("should find one innovation action if Innovator by ID", async () => {
    const action = await actionService.create(
      qAccessorRequestUser,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      }
    );

    const item = await actionService.find(
      innovatorRequestUser,
      action.id,
      innovation.id
    );

    expect(item).toBeDefined();
    expect(item.id).toEqual(action.id);
  });

  it("should find one innovation action if Accessor in a support unit by ID", async () => {
    const action = await actionService.create(
      qAccessorRequestUser,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      }
    );

    const item = await actionService.find(
      accessorRequestUser,
      action.id,
      innovation.id
    );

    expect(item).toBeDefined();
    expect(item.id).toEqual(action.id);
  });

  it("should find one innovation action if Q. Accessor in a shared organisation by ID", async () => {
    const action = await actionService.create(
      qAccessorRequestUser,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      }
    );

    const item = await actionService.find(
      qAccessorRequestUser,
      action.id,
      innovation.id
    );

    expect(item).toBeDefined();
    expect(item.id).toEqual(action.id);
  });

  it("should find all open actions if Qual. Accessor", async () => {
    await actionService.create(qAccessorRequestUser, innovation.id, {
      description: "missing good descriptions",
      section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
    });

    await actionService.create(qAccessorRequestUser, innovation.id, {
      description: "missing good descriptions",
      section: InnovationSectionCatalogue.MARKET_RESEARCH,
    });

    const item = await actionService.findAllByAccessor(
      qAccessorRequestUser,
      true,
      0,
      10
    );

    expect(item).toBeDefined();
    expect(item.count).toEqual(2);
  });

  it("should find all open actions if Qual. Accessor with column order", async () => {
    await actionService.create(qAccessorRequestUser, innovation.id, {
      description: "missing good descriptions",
      section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
    });

    await actionService.create(qAccessorRequestUser, innovation.id, {
      description: "missing good descriptions",
      section: InnovationSectionCatalogue.MARKET_RESEARCH,
    });

    const item = await actionService.findAllByAccessor(
      qAccessorRequestUser,
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
    await actionService.create(qAccessorRequestUser, innovation.id, {
      description: "missing good descriptions",
      section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
    });

    await actionService.create(qAccessorRequestUser, innovation.id, {
      description: "missing good descriptions",
      section: InnovationSectionCatalogue.MARKET_RESEARCH,
    });

    const item = await actionService.findAllByAccessor(
      accessorRequestUser,
      true,
      0,
      10
    );

    expect(item).toBeDefined();
    expect(item.count).toEqual(2);
  });

  it("should find all close actions if Qual. Accessor", async () => {
    const action = await actionService.create(
      qAccessorRequestUser,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      }
    );
    await actionService.updateByAccessor(
      qAccessorRequestUser,
      action.id,
      innovation.id,
      {
        status: InnovationActionStatus.COMPLETED,
      }
    );

    await actionService.create(qAccessorRequestUser, innovation.id, {
      description: "missing good descriptions",
      section: InnovationSectionCatalogue.MARKET_RESEARCH,
    });

    const item = await actionService.findAllByAccessor(
      qAccessorRequestUser,
      false,
      0,
      10
    );

    expect(item).toBeDefined();
    expect(item.count).toEqual(1);
  });

  it("should find all close actions if Accessor", async () => {
    const action = await actionService.create(
      qAccessorRequestUser,
      innovation.id,
      {
        description: "missing good descriptions",
        section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      }
    );
    await actionService.updateByAccessor(
      qAccessorRequestUser,
      action.id,
      innovation.id,
      {
        status: InnovationActionStatus.COMPLETED,
      }
    );

    await actionService.create(qAccessorRequestUser, innovation.id, {
      description: "missing good descriptions",
      section: InnovationSectionCatalogue.MARKET_RESEARCH,
    });

    const item = await actionService.findAllByAccessor(
      accessorRequestUser,
      false,
      0,
      10
    );

    expect(item).toBeDefined();
    expect(item.count).toEqual(1);
  });
});
