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
  Notification,
  NotificationUser,
  Organisation,
  OrganisationType,
  OrganisationUnit,
  OrganisationUnitUser,
  OrganisationUser,
  User,
  UserType,
} from "@domain/index";
import {
  InnovationNotFoundError,
  InvalidParamsError,
  InvalidUserRoleError,
} from "@services/errors";
import { InnovationListModel } from "@services/models/InnovationListModel";
import { RequestUser } from "@services/models/RequestUser";
import { UserService } from "@services/services/User.service";
import { getConnection } from "typeorm";
import { closeTestsConnection, setupTestsConnection } from "..";
import * as helpers from "../helpers";
import { InnovationService } from "../services/Innovation.service";
import * as fixtures from "../__fixtures__";

describe("Innovator Service Suite", () => {
  let innovationService: InnovationService;
  let userService: UserService;
  let accessorOrganisation: Organisation;

  let innovatorRequestUser: RequestUser;
  let accessorRequestUser: RequestUser;
  let qAccessorRequestUser: RequestUser;
  let assessmentRequestUser: RequestUser;

  beforeAll(async () => {
    // await setupTestsConnection();
    innovationService = new InnovationService(process.env.DB_TESTS_NAME);
    userService = new UserService(process.env.DB_TESTS_NAME);

    const innovatorUser = await fixtures.createInnovatorUser();
    const innovatorOrganisation = await fixtures.createOrganisation(
      OrganisationType.INNOVATOR
    );
    await fixtures.addUserToOrganisation(
      innovatorUser,
      innovatorOrganisation,
      InnovatorOrganisationRole.INNOVATOR_OWNER
    );

    const qualAccessorUser = await fixtures.createAccessorUser();
    const accessorUser = await fixtures.createAccessorUser();
    const assessmentUser = await fixtures.createAssessmentUser();

    accessorOrganisation = await fixtures.createOrganisation(
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

    innovatorRequestUser = fixtures.getRequestUser(innovatorUser);
    assessmentRequestUser = fixtures.getRequestUser(assessmentUser);
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

    await query.from(NotificationUser).execute();
    await query.from(Notification).execute();
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
      owner: { id: innovatorRequestUser.id },
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
    const innovation = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
    });
    await fixtures.saveInnovations(innovation);

    const result = await innovationService.findAllByInnovator(
      innovatorRequestUser,
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
  });

  it("should find all innovations by q. accessor when findAllByAccessorAndSupportStatus() with status UNASSIGNED", async () => {
    const innovationA = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
      organisationShares: [{ id: accessorOrganisation.id }],
      status: InnovationStatus.IN_PROGRESS,
    });

    const innovationB = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
    });

    await fixtures.saveInnovations(innovationA, innovationB);

    const result = await innovationService.findAllByAccessorAndSupportStatus(
      qAccessorRequestUser,
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
      { id: accessorRequestUser.id, displayName: ":ACCESSOR" },
      { id: qAccessorRequestUser.id, displayName: ":QUALIFYING_ACCESSOR" },
    ]);

    const innovationA = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
      organisationShares: [{ id: accessorOrganisation.id }],
      status: InnovationStatus.IN_PROGRESS,
    });

    const innovationB = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
    });

    await fixtures.saveInnovations(innovationA, innovationB);
    await fixtures.createSupportInInnovation(
      qAccessorRequestUser,
      innovationA,
      qAccessorRequestUser.organisationUnitUser.id
    );

    const result = await innovationService.findAllByAccessorAndSupportStatus(
      qAccessorRequestUser,
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
      { id: accessorRequestUser.id, displayName: ":ACCESSOR" },
      { id: qAccessorRequestUser.id, displayName: ":QUALIFYING_ACCESSOR" },
    ]);

    const innovationA = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
      organisationShares: [{ id: accessorOrganisation.id }],
      status: InnovationStatus.IN_PROGRESS,
    });

    const innovationB = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
    });

    await fixtures.saveInnovations(innovationA, innovationB);
    await fixtures.createSupportInInnovation(
      qAccessorRequestUser,
      innovationA,
      qAccessorRequestUser.organisationUnitUser.id
    );

    const result = await innovationService.findAllByAccessorAndSupportStatus(
      accessorRequestUser,
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
      { id: accessorRequestUser.id, displayName: ":ACCESSOR" },
      { id: qAccessorRequestUser.id, displayName: ":QUALIFYING_ACCESSOR" },
    ]);

    const innovationA = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
      organisationShares: [{ id: accessorOrganisation.id }],
      status: InnovationStatus.IN_PROGRESS,
    });

    const innovationB = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
    });

    await fixtures.saveInnovations(innovationA, innovationB);
    await fixtures.createSupportInInnovation(
      qAccessorRequestUser,
      innovationA,
      qAccessorRequestUser.organisationUnitUser.id
    );

    const result = await innovationService.findAllByAccessorAndSupportStatus(
      accessorRequestUser,
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
        {
          id: ":user_id",
          type: UserType.ACCESSOR,
        },
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

    try {
      await innovationService.findAllByAccessorAndSupportStatus(
        {
          id: ":user_id",
          type: UserType.ACCESSOR,
          organisationUser: {
            id: ":organisation_user_id",
            role: InnovatorOrganisationRole.INNOVATOR_OWNER,
            organisation: {
              id: ":organisation_id",
              name: ":organisation_name",
            },
          },
        },
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
    const innovationObj = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    const result = await innovationService.getInnovationOverview(
      innovatorRequestUser,
      innovation.id
    );

    expect(result).toBeDefined();
    expect(result.id).toBe(innovation.id);
  });

  it("should throw an error when getInnovationOverview() without id", async () => {
    let err;
    try {
      await innovationService.getInnovationOverview(innovatorRequestUser, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw an error when getInnovationOverview() without innovatorId", async () => {
    let err;
    try {
      await innovationService.getInnovationOverview(null, "id");
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should find the innovation with QUALIFYING_ACCESSOR and return an innovation summary", async () => {
    const fakeInnovations = await fixtures.saveInnovations(
      fixtures.generateInnovation({
        owner: { id: innovatorRequestUser.id },
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

    const result = await innovationService.getAccessorInnovationSummary(
      qAccessorRequestUser,
      fakeInnovations[0].id
    );

    expect(result).toBeDefined();
  });

  it("should find the innovation with NEEDS_ASSESSMENT and return an assessment innovation summary", async () => {
    const fakeInnovations = await fixtures.saveInnovations(
      fixtures.generateInnovation({
        owner: { id: innovatorRequestUser.id },
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
      assessmentRequestUser,
      fakeInnovations[0].id
    );

    expect(result).toBeDefined();
  });

  it("should list innovations within the list of statuses", async () => {
    const innovations: Innovation[] =
      await fixtures.saveInnovationsWithAssessment(
        fixtures.generateInnovation({
          owner: { id: innovatorRequestUser.id },
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
        assessmentRequestUser,
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
      owner: { id: innovatorRequestUser.id },
      surveyId: "abc",
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    await innovationService.submitInnovation(
      innovatorRequestUser,
      innovation.id
    );

    const result = await innovationService.getInnovationOverview(
      innovatorRequestUser,
      innovation.id
    );

    expect(result).toBeDefined();
    expect(result.id).toBe(innovation.id);
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
        innovatorRequestUser,
        "62e5c505-afe4-47be-9b46-0f0b79dca954"
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
        assessmentRequestUser,
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
        assessmentRequestUser,
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
        owner: { id: innovatorRequestUser.id },
        status: InnovationStatus.IN_PROGRESS,
        organisationShares: [{ id: accessorOrganisation.id }],
      })
    );

    await fixtures.createSupportInInnovation(
      qAccessorRequestUser,
      fakeInnovation,
      qAccessorRequestUser.organisationUnitUser.id
    );

    const result = await innovationService.getOrganisationShares(
      innovatorRequestUser,
      fakeInnovation.id
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
      await innovationService.updateOrganisationShares(
        innovatorRequestUser,
        "b",
        []
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should update the innovation organisation shares", async () => {
    const fakeInnovation = await fixtures.saveInnovation(
      fixtures.generateInnovation({
        owner: { id: innovatorRequestUser.id },
        status: InnovationStatus.IN_PROGRESS,
        organisationShares: [{ id: accessorOrganisation.id }],
      })
    );

    await fixtures.createSupportInInnovation(
      qAccessorRequestUser,
      fakeInnovation,
      qAccessorRequestUser.organisationUnitUser.id
    );

    await fixtures.createInnovationAction(qAccessorRequestUser, fakeInnovation);

    const org = await fixtures.createOrganisation(OrganisationType.ACCESSOR);

    await innovationService.updateOrganisationShares(
      innovatorRequestUser,
      fakeInnovation.id,
      [org.id]
    );

    const search = await innovationService.getOrganisationShares(
      innovatorRequestUser,
      fakeInnovation.id
    );

    expect(search).toBeDefined();
    expect(search[0].status).toEqual(InnovationSupportStatus.UNASSIGNED);
  });
});
