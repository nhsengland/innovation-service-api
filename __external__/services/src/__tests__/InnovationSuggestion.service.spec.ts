import {
  AccessorOrganisationRole,
  ActivityLog,
  Comment,
  Innovation,
  InnovationAction,
  InnovationAssessment,
  InnovationSection,
  InnovationSupport,
  InnovationSupportLog,
  InnovationSupportLogType,
  Notification,
  NotificationUser,
  Organisation,
  OrganisationType,
  OrganisationUnit,
  OrganisationUnitUser,
  OrganisationUser,
  User,
  UserRole,
} from "@domain/index";
import { InnovationNotFoundError, InvalidParamsError } from "@services/errors";
import { RequestUser } from "@services/models/RequestUser";
import { InnovationSuggestionService } from "@services/services/InnovationSuggestion.service";
import * as dotenv from "dotenv";
import * as path from "path";
import { getConnection } from "typeorm";
import { closeTestsConnection, setupTestsConnection } from "..";
import { InnovationSupportLogService } from "../services/InnovationSupportLog.service";
import * as fixtures from "../__fixtures__";

describe("Innovation Suggestion Suite", () => {
  let suggestionService: InnovationSuggestionService;
  let supportLogService: InnovationSupportLogService;
  let innovation: Innovation;

  let innovatorRequestUser: RequestUser;
  let qAccessorRequestUser: RequestUser;
  let organisationUnit: OrganisationUnit;
  let innovatorUser: User;

  beforeAll(async () => {
    // await setupTestsConnection();

    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });
    supportLogService = new InnovationSupportLogService(
      process.env.DB_TESTS_NAME
    );
    suggestionService = new InnovationSuggestionService(
      process.env.DB_TESTS_NAME
    );

    innovatorUser = await fixtures.createInnovatorUser();
    const qualAccessorUser = await fixtures.createAccessorUser();
    const accessorUser = await fixtures.createAccessorUser();
    const assessmentUser = await fixtures.createAssessmentUser();

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

    organisationUnit = await fixtures.createOrganisationUnit(
      accessorOrganisation
    );
    const organisationUnitQAccessorUser = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationQAccessorUser,
      organisationUnit
    );
    await fixtures.addOrganisationUserToOrganisationUnit(
      organisationAccessorUser,
      organisationUnit
    );

    organisationUnit = await fixtures.createOrganisationUnit(
      accessorOrganisation
    );

    const innovationObj = fixtures.generateInnovation({
      owner: innovatorUser,
      surveyId: "abc",
      organisationShares: [{ id: accessorOrganisation.id }],
    });

    innovation = await fixtures.saveInnovation(innovationObj);
    const assessmentRequestUser = fixtures.getRequestUser(assessmentUser);
    const assessment = await fixtures.createAssessment(
      assessmentRequestUser,
      innovation
    );
    await fixtures.addSuggestionsToAssessment(
      assessmentRequestUser,
      assessment.id,
      innovation.id,
      [organisationUnit]
    );

    innovatorRequestUser = fixtures.getRequestUser(innovatorUser);
    qAccessorRequestUser = fixtures.getRequestUser(
      qualAccessorUser,
      organisationQAccessorUser,
      organisationUnitQAccessorUser
    );

    await fixtures.createSupportInInnovation(
      qAccessorRequestUser,
      innovation,
      qAccessorRequestUser.organisationUnitUser.id
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
    await query.from(UserRole).execute();
    await query.from(User).execute();

    // closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(ActivityLog).execute();
    await query.from(InnovationSupportLog).execute();
    await query.from(NotificationUser).execute();
    await query.from(Notification).execute();
    await query.from(Comment).execute();
    await query.from(InnovationAssessment).execute();
    await query.from(InnovationAction).execute();
    await query.from(InnovationSection).execute();
    await query.from(InnovationSupport).execute();
    await query.from(Innovation).execute();
  });

  it("should find all suggestions by innovation with supports", async () => {
    await supportLogService.create(qAccessorRequestUser, innovation.id, {
      type: InnovationSupportLogType.STATUS_UPDATE,
      description: ":description",
    });

    await supportLogService.create(qAccessorRequestUser, innovation.id, {
      type: InnovationSupportLogType.ACCESSOR_SUGGESTION,
      description: ":description",
      organisationUnits: [organisationUnit.id],
    });

    const item = await suggestionService.findAllByInnovation(
      innovatorRequestUser,
      innovation.id
    );

    expect(item).toBeDefined();
  });

  it("should find all suggestions by innovation without assessment", async () => {
    const innovationObj = fixtures.generateInnovation({
      owner: innovatorUser,
      surveyId: "abcd",
      organisationShares: [],
    });

    innovation = await fixtures.saveInnovation(innovationObj);

    const item = await suggestionService.findAllByInnovation(
      innovatorRequestUser,
      innovation.id
    );

    expect(item).toBeDefined();
  });

  it("should throw when findAllByInnovation with invalid params", async () => {
    let err;
    try {
      await suggestionService.findAllByInnovation(null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw an error when findAllByInnovation() with innovation not found", async () => {
    let err;
    try {
      await suggestionService.findAllByInnovation(
        innovatorRequestUser,
        "62e5c505-afe4-47be-9b46-0f0b79dca954"
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InnovationNotFoundError);
  });
});
