import {
  AccessorOrganisationRole,
  Comment,
  Innovation,
  InnovationAction,
  InnovationAssessment,
  InnovationSection,
  InnovationStatus,
  InnovationSupport,
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
  let qualAccessorUser: User;
  let innovatorUser: User;
  let accessorOrganisation: Organisation;
  let organisationQAccessorUser: OrganisationUser;

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
    accessorOrganisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );
    organisationQAccessorUser = await fixtures.addUserToOrganisation(
      qualAccessorUser,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );

    const organisationUnit = await fixtures.createOrganisationUnit(
      accessorOrganisation
    );
    await fixtures.addOrganisationUserToOrganisationUnit(
      organisationQAccessorUser,
      organisationUnit
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
    await query.from(InnovationSupport).execute();
    await query.from(InnovationAction).execute();
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

  it("should find all innovations by qualifying accessor when findAllByAccessor()", async () => {
    const innovationA = fixtures.generateInnovation({
      owner: innovatorUser,
      organisationShares: [{ id: accessorOrganisation.id }],
      status: InnovationStatus.IN_PROGRESS,
    });

    const innovationB = fixtures.generateInnovation({
      owner: innovatorUser,
    });

    await fixtures.saveInnovations(innovationA, innovationB);

    const result = await innovationService.findAllByAccessor(
      qualAccessorUser.id,
      [organisationQAccessorUser]
    );

    expect(result[0].length).toEqual(1);
    expect(result[1]).toEqual(1);
  });

  it("should find and paginate innovations by qualifying accessor when findAllByAccessor()", async () => {
    const innovations = [];
    for (let i = 0; i < 20; i++) {
      innovations[i] = fixtures.generateInnovation({
        owner: innovatorUser,
        surveyId: `survey_${i}`,
        name: `innovation_${i}`,
        description: `description_${i}`,
        organisationShares: [{ id: accessorOrganisation.id }],
        status: InnovationStatus.IN_PROGRESS,
      });
    }

    await fixtures.saveInnovations(...innovations);

    const count = 10;
    const page = 2;
    const result = await innovationService.findAllByAccessor(
      qualAccessorUser.id,
      [organisationQAccessorUser],
      {
        take: count,
        skip: (page - 1) * count,
      }
    );

    expect(result[0].length).toEqual(10);
    expect(result[1]).toEqual(20);
  });

  it("should throw an error when findAllByAccessor() without userId", async () => {
    let err;
    try {
      await innovationService.findAllByAccessor(undefined, []);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should return empty when findAllByAccessor() with a user without organisations", async () => {
    let err;
    try {
      await innovationService.findAllByAccessor("userId", []);
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
      await innovationService.findAllByAccessor(dummy.innovatorId, [orgUser]);
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
    const qAccessorOrganisations = await fixtures.findUserOrganisations(
      qualAccessorUser.id
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
});
