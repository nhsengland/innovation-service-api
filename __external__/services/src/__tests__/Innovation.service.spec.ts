import {
  AccessorOrganisationRole,
  Comment,
  Innovation,
  InnovationAction,
  InnovationAssessment,
  InnovationSection,
  InnovationStatus,
  InnovationSupport,
  InnovationSupportStatus,
  InnovatorOrganisationRole,
  Organisation,
  OrganisationType,
  OrganisationUnit,
  OrganisationUnitUser,
  OrganisationUser,
  User,
} from "@domain/index";
import {
  InnovationNotFoundError,
  InvalidParamsError,
  InvalidUserRoleError,
} from "@services/errors";
import { InnovationListModel } from "@services/models/InnovationListModel";
import { UserService } from "@services/services/User.service";
import { getConnection } from "typeorm";
import { closeTestsConnection, setupTestsConnection } from "..";
import * as helpers from "../helpers";
import { InnovationService } from "../services/Innovation.service";
import * as fixtures from "../__fixtures__";

const dummy = {
  innovatorId: "innovatorId",
  accessorId: "accessorId",
};

describe("Innovator Service Suite", () => {
  let innovationService: InnovationService;
  let userService: UserService;
  let accessorUser: User;
  let qualAccessorUser: User;
  let innovatorUser: User;
  let accessorOrganisation: Organisation;
  let organisationQAccessorUser: OrganisationUser;
  let organisationAccessorUser: OrganisationUser;
  let organisationUnitQAccessorUser: OrganisationUnitUser;
  let organisationUnitAccessorUser: OrganisationUnitUser;
  let qAccessorUserOrganisations: OrganisationUser[];
  let accessorUserOrganisations: OrganisationUser[];

  beforeAll(async () => {
    // await setupTestsConnection();
    innovationService = new InnovationService(process.env.DB_TESTS_NAME);
    userService = new UserService(process.env.DB_TESTS_NAME);

    innovatorUser = await fixtures.createInnovatorUser();
    const innovatorOrganisation = await fixtures.createOrganisation(
      OrganisationType.INNOVATOR
    );
    await fixtures.addUserToOrganisation(
      innovatorUser,
      innovatorOrganisation,
      InnovatorOrganisationRole.INNOVATOR_OWNER
    );

    qualAccessorUser = await fixtures.createAccessorUser();
    accessorUser = await fixtures.createAccessorUser();

    accessorOrganisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );
    organisationQAccessorUser = await fixtures.addUserToOrganisation(
      qualAccessorUser,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );
    organisationAccessorUser = await fixtures.addUserToOrganisation(
      accessorUser,
      accessorOrganisation,
      AccessorOrganisationRole.ACCESSOR
    );

    const organisationUnit = await fixtures.createOrganisationUnit(
      accessorOrganisation
    );
    organisationUnitQAccessorUser = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationQAccessorUser,
      organisationUnit
    );
    organisationUnitAccessorUser = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationAccessorUser,
      organisationUnit
    );

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
    await query.from(User).execute();
    // closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(Comment).execute();
    await query.from(InnovationAssessment).execute();
    await query.from(InnovationAction).execute();
    await query.from(InnovationSupport).execute();
    await query.from(InnovationSection).execute();
    await query.from(Innovation).execute();
  });

  it("should instantiate the innovation service", async () => {
    expect(innovationService).toBeDefined();
  });

  it("should throw invalid operation when findAll()", async () => {
    const innovation: Innovation = Innovation.new({
      owner: innovatorUser,
      surveyId: "abc",
      name: "My Innovation",
      description: "My Description",
      countryName: "UK",
    });

    await innovationService.create(innovation);

    let err;
    try {
      await innovationService.findAll({ name: "My Innovation" });
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.message).toContain("Not implemented.");
  });

  it("should find all innovations by innovator Id when findAllByInnovator()", async () => {
    const innovation = fixtures.generateInnovation({ owner: innovatorUser });
    await fixtures.saveInnovations(innovation);

    const result = await innovationService.findAllByInnovator(
      innovatorUser.id,
      { name: innovation.name }
    );

    expect(result.length).toBeGreaterThan(0);
  });

  it("should throw when id is null in findAllByInnovator()", async () => {
    let err;
    try {
      await innovationService.findAllByInnovator(null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
    expect(err.message).toContain("Invalid userId. You must define the owner.");
  });

  it("should find all innovations by q. accessor when findAllByAccessorAndSupportStatus() with status UNASSIGNED", async () => {
    const innovationA = fixtures.generateInnovation({
      owner: innovatorUser,
      organisationShares: [{ id: accessorOrganisation.id }],
      status: InnovationStatus.IN_PROGRESS,
    });

    const innovationB = fixtures.generateInnovation({
      owner: innovatorUser,
    });

    await fixtures.saveInnovations(innovationA, innovationB);

    const result = await innovationService.findAllByAccessorAndSupportStatus(
      qualAccessorUser.id,
      qAccessorUserOrganisations,
      InnovationSupportStatus.UNASSIGNED,
      false,
      0,
      10
    );

    expect(result.data.length).toEqual(1);
    expect(result.count).toEqual(1);
  });

  it("should find all innovations by q. accessor when findAllByAccessorAndSupportStatus() with status ENGAGING and assignedToMe", async () => {
    spyOn(helpers, "authenticateWitGraphAPI").and.returnValue(":access_token");
    spyOn(helpers, "getUserFromB2C").and.returnValue({
      displayName: "Q Accessor A",
    });
    spyOn(helpers, "getUsersFromB2C").and.returnValues([
      { id: accessorUser.id, displayName: ":ACCESSOR" },
      { id: qualAccessorUser.id, displayName: ":QUALIFYING_ACCESSOR" },
    ]);

    const innovationA = fixtures.generateInnovation({
      owner: innovatorUser,
      organisationShares: [{ id: accessorOrganisation.id }],
      status: InnovationStatus.IN_PROGRESS,
    });

    const innovationB = fixtures.generateInnovation({
      owner: innovatorUser,
    });

    await fixtures.saveInnovations(innovationA, innovationB);
    await fixtures.createSupportInInnovation(
      innovationA,
      qualAccessorUser,
      qAccessorUserOrganisations[0],
      organisationUnitQAccessorUser
    );

    const result = await innovationService.findAllByAccessorAndSupportStatus(
      qualAccessorUser.id,
      qAccessorUserOrganisations,
      InnovationSupportStatus.ENGAGING,
      true,
      0,
      10
    );

    expect(result.data.length).toEqual(1);
    expect(result.count).toEqual(1);
  });

  it("should find all innovations by accessor when findAllByAccessorAndSupportStatus() without assignedToMe", async () => {
    spyOn(helpers, "authenticateWitGraphAPI").and.returnValue(":access_token");
    spyOn(helpers, "getUserFromB2C").and.returnValue({
      displayName: "Q Accessor A",
    });
    spyOn(helpers, "getUsersFromB2C").and.returnValues([
      { id: accessorUser.id, displayName: ":ACCESSOR" },
      { id: qualAccessorUser.id, displayName: ":QUALIFYING_ACCESSOR" },
    ]);

    const innovationA = fixtures.generateInnovation({
      owner: innovatorUser,
      organisationShares: [{ id: accessorOrganisation.id }],
      status: InnovationStatus.IN_PROGRESS,
    });

    const innovationB = fixtures.generateInnovation({
      owner: innovatorUser,
    });

    await fixtures.saveInnovations(innovationA, innovationB);
    await fixtures.createSupportInInnovation(
      innovationA,
      qualAccessorUser,
      qAccessorUserOrganisations[0],
      organisationUnitQAccessorUser
    );

    const result = await innovationService.findAllByAccessorAndSupportStatus(
      accessorUser.id,
      accessorUserOrganisations,
      InnovationSupportStatus.ENGAGING,
      false,
      0,
      10
    );

    expect(result.data.length).toEqual(1);
    expect(result.count).toEqual(1);
  });

  it("should find all innovations by accessor when findAllByAccessorAndSupportStatus() with assignedToMe", async () => {
    spyOn(helpers, "authenticateWitGraphAPI").and.returnValue(":access_token");
    spyOn(helpers, "getUserFromB2C").and.returnValue({
      displayName: "Q Accessor A",
    });
    spyOn(helpers, "getUsersFromB2C").and.returnValues([
      { id: accessorUser.id, displayName: ":ACCESSOR" },
      { id: qualAccessorUser.id, displayName: ":QUALIFYING_ACCESSOR" },
    ]);

    const innovationA = fixtures.generateInnovation({
      owner: innovatorUser,
      organisationShares: [{ id: accessorOrganisation.id }],
      status: InnovationStatus.IN_PROGRESS,
    });

    const innovationB = fixtures.generateInnovation({
      owner: innovatorUser,
    });

    await fixtures.saveInnovations(innovationA, innovationB);
    await fixtures.createSupportInInnovation(
      innovationA,
      qualAccessorUser,
      qAccessorUserOrganisations[0],
      organisationUnitQAccessorUser
    );

    const result = await innovationService.findAllByAccessorAndSupportStatus(
      accessorUser.id,
      accessorUserOrganisations,
      InnovationSupportStatus.ENGAGING,
      true,
      0,
      10
    );

    expect(result.data.length).toEqual(0);
    expect(result.count).toEqual(0);
  });

  it("should throw an error when findAllByAccessor() with invalid params", async () => {
    let err;
    try {
      await innovationService.findAllByAccessorAndSupportStatus(
        undefined,
        [],
        null,
        null,
        null,
        null
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should return empty when findAllByAccessor() with a user without organisations", async () => {
    let err;
    try {
      await innovationService.findAllByAccessorAndSupportStatus(
        "userId",
        [],
        null,
        null,
        null,
        null
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
  });

  it("should throw an error when findAllByAccessor() with user with invalid role", async () => {
    let err;

    const orgUser = OrganisationUser.new({
      role: InnovatorOrganisationRole.INNOVATOR_OWNER,
    });

    try {
      await innovationService.findAllByAccessorAndSupportStatus(
        dummy.innovatorId,
        [orgUser],
        InnovationSupportStatus.ENGAGING,
        false,
        0,
        10
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidUserRoleError);
  });

  it("should find the innovation by innovator Id and innovation Id when getInnovationOverview()", async () => {
    const innovationObj = fixtures.generateInnovation({ owner: innovatorUser });
    const innovation = await fixtures.saveInnovations(innovationObj);

    const result = await innovationService.getInnovationOverview(
      innovation[0].id,
      innovatorUser.id
    );

    expect(result).toBeDefined();
    expect(result.ownerId).toBe(innovatorUser.id);
  });

  it("should throw an error when getInnovationOverview() without id", async () => {
    let err;
    try {
      await innovationService.getInnovationOverview(undefined, "id");
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw an error when getInnovationOverview() without innovatorId", async () => {
    let err;
    try {
      await innovationService.getInnovationOverview("id", undefined);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should find the innovation with QUALIFYING_ACCESSOR and return an innovation summary", async () => {
    const fakeInnovations = await fixtures.saveInnovations(
      fixtures.generateInnovation({
        owner: innovatorUser,
        status: InnovationStatus.IN_PROGRESS,
        organisationShares: [{ id: accessorOrganisation.id }],
      })
    );

    spyOn(helpers, "authenticateWitGraphAPI").and.returnValue(":access_token");
    spyOn(helpers, "getUserFromB2C").and.returnValue({
      displayName: ":display_name",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });
    spyOn(userService, "getProfile").and.returnValue({
      id: fakeInnovations[0].id,
      displayName: ":displayName",
    });

    const qAccessorOrganisations = await fixtures.findUserOrganisations(
      qualAccessorUser.id
    );

    const result = await innovationService.getAccessorInnovationSummary(
      fakeInnovations[0].id,
      qualAccessorUser.id,
      qAccessorOrganisations
    );

    expect(result).toBeDefined();
  });

  it("should find the innovation with NEEDS_ASSESSMENT and return an assessment innovation summary", async () => {
    const fakeInnovations = await fixtures.saveInnovations(
      fixtures.generateInnovation({
        owner: innovatorUser,
        status: InnovationStatus.WAITING_NEEDS_ASSESSMENT,
      })
    );

    spyOn(helpers, "authenticateWitGraphAPI").and.returnValue(":access_token");
    spyOn(helpers, "getUserFromB2C").and.returnValue({
      displayName: ":display_name",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });

    spyOn(userService, "getProfile").and.returnValue({
      id: fakeInnovations[0].id,
      displayName: ":displayName",
      type: null,
      organisations: [
        {
          id: ":id_1",
          name: ":organisation_name",
          role: InnovatorOrganisationRole.INNOVATOR_OWNER,
        },
      ],
      email: "test_user@example.com",
      phone: "+351960000000",
    });

    const result = await innovationService.getAssessmentInnovationSummary(
      fakeInnovations[0].id
    );

    expect(result).toBeDefined();
  });

  it("should list innovations within the list of statuses", async () => {
    const innovations: Innovation[] = await fixtures.saveInnovationsWithAssessment(
      fixtures.generateInnovation({
        owner: innovatorUser,
      })
    );

    spyOn(helpers, "authenticateWitGraphAPI").and.stub();
    spyOn(helpers, "getUsersFromB2C").and.returnValues(
      innovations.map((inno) => ({
        id: inno.assessments.map((a) => a.assignTo).join(),
        displayName: "assessement_user_name",
      }))
    );

    let result: InnovationListModel;
    try {
      result = await innovationService.getInnovationListByState(
        [InnovationStatus.NEEDS_ASSESSMENT],
        0,
        10
      );
    } catch (error) {
      throw error;
    }

    expect(result.count).toBe(1);
    expect(result.data.length).toBe(1);
    expect(result.data[0].assessment.assignTo).toEqual({
      name: "assessement_user_name",
    });
  });

  it("should submit the innovation by innovator Id and innovation Id", async () => {
    const innovationObj = fixtures.generateInnovation({
      owner: innovatorUser,
      surveyId: "abc",
    });
    const innovations = await fixtures.saveInnovations(innovationObj);

    await innovationService.submitInnovation(
      innovations[0].id,
      innovatorUser.id
    );

    const result = await innovationService.getInnovationOverview(
      innovations[0].id,
      innovatorUser.id
    );

    expect(result).toBeDefined();
    expect(result.ownerId).toBe(innovatorUser.id);
  });

  it("should throw an error when submitInnovation() without id", async () => {
    let err;
    try {
      await innovationService.submitInnovation(undefined, "id");
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw an error when submitInnovation() with innovation not found", async () => {
    let err;
    try {
      await innovationService.submitInnovation(
        "62e5c505-afe4-47be-9b46-0f0b79dca954",
        "id"
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InnovationNotFoundError);
  });

  it("should not list ASSESSMENT innovations with status CREATED", async () => {
    const innovator = await fixtures.createInnovatorUser();
    await fixtures.saveInnovations(
      fixtures.generateInnovation({ owner: innovator }),
      fixtures.generateInnovation({ owner: innovator })
    );

    spyOn(helpers, "authenticateWitGraphAPI").and.stub();
    spyOn(helpers, "getUsersFromB2C").and.returnValues([]);

    let result: InnovationListModel;
    try {
      result = await innovationService.getInnovationListByState(
        [InnovationStatus.NEEDS_ASSESSMENT],
        0,
        10
      );
    } catch (error) {
      throw error;
    }

    expect(result.count).toBe(0);
  });

  it("should list ASSESSMENT innovations with status NEEDS_ASSESSMENT and without supports and assessments", async () => {
    const innovator = await fixtures.createInnovatorUser();
    await fixtures.saveInnovations(
      fixtures.generateInnovation({
        owner: innovator,
        status: InnovationStatus.NEEDS_ASSESSMENT,
      }),
      fixtures.generateInnovation({ owner: innovator })
    );

    spyOn(helpers, "authenticateWitGraphAPI").and.stub();
    spyOn(helpers, "getUsersFromB2C").and.returnValues([]);

    let result: InnovationListModel;
    try {
      result = await innovationService.getInnovationListByState(
        [InnovationStatus.NEEDS_ASSESSMENT],
        0,
        10
      );
    } catch (error) {
      throw error;
    }

    expect(result.count).toBe(1);
  });

  it("should throw an error when getOrganisationShares() with invalid params", async () => {
    let err;
    try {
      await innovationService.getInnovationOverview(undefined, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should find the innovation organisation shares", async () => {
    const fakeInnovation = await fixtures.saveInnovation(
      fixtures.generateInnovation({
        owner: innovatorUser,
        status: InnovationStatus.IN_PROGRESS,
        organisationShares: [{ id: accessorOrganisation.id }],
      })
    );

    await fixtures.createSupportInInnovation(
      fakeInnovation,
      qualAccessorUser,
      qAccessorUserOrganisations[0],
      organisationUnitQAccessorUser
    );

    const result = await innovationService.getOrganisationShares(
      fakeInnovation.id,
      innovatorUser.id
    );

    expect(result).toBeDefined();
    expect(result[0].status).toEqual(InnovationSupportStatus.ENGAGING);
  });

  it("should throw an error when updateOrganisationShares() with invalid params", async () => {
    let err;
    try {
      await innovationService.updateOrganisationShares(undefined, null, []);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw an error when updateOrganisationShares() without organisations", async () => {
    let err;
    try {
      await innovationService.updateOrganisationShares("a", "b", []);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should update the innovation organisation shares", async () => {
    const fakeInnovation = await fixtures.saveInnovation(
      fixtures.generateInnovation({
        owner: innovatorUser,
        status: InnovationStatus.IN_PROGRESS,
        organisationShares: [{ id: accessorOrganisation.id }],
      })
    );

    await fixtures.createSupportInInnovation(
      fakeInnovation,
      qualAccessorUser,
      qAccessorUserOrganisations[0],
      organisationUnitQAccessorUser
    );

    await fixtures.createInnovationAction(
      fakeInnovation,
      qualAccessorUser,
      qAccessorUserOrganisations[0]
    );

    const org = await fixtures.createOrganisation(OrganisationType.ACCESSOR);

    await innovationService.updateOrganisationShares(
      fakeInnovation.id,
      innovatorUser.id,
      [org.id]
    );

    const search = await innovationService.getOrganisationShares(
      fakeInnovation.id,
      innovatorUser.id
    );

    expect(search).toBeDefined();
    expect(search[0].status).toEqual(InnovationSupportStatus.UNASSIGNED);
  });
});
