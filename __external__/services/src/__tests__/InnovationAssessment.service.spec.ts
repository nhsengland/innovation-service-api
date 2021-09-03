import {
  AccessorOrganisationRole,
  Comment,
  Innovation,
  InnovationAssessment,
  MaturityLevelCatalogue,
  Notification,
  NotificationUser,
  Organisation,
  OrganisationType,
  OrganisationUnit,
  OrganisationUser,
  User,
} from "@domain/index";
import { RequestUser } from "@services/models/RequestUser";
import { LoggerService } from "@services/services/Logger.service";
import { NotificationService } from "@services/services/Notification.service";
import { getConnection } from "typeorm";
import { closeTestsConnection, setupTestsConnection } from "..";
import * as helpers from "../helpers";
import { InnovationAssessmentService } from "../services/InnovationAssessment.service";
import * as fixtures from "../__fixtures__";
import * as dotenv from "dotenv";
import * as path from "path";
const dummy = {
  assessment: {
    description: "Assessment Desc",
  },
};

describe("Innovation Assessment Suite", () => {
  let assessmentService: InnovationAssessmentService;
  let notificationService: NotificationService;
  let innovation: Innovation;

  let assessmentRequestUser: RequestUser;
  let innovatorRequestUser: RequestUser;
  let qAccessorRequestUser: RequestUser;

  let fakeOrganisationUnit: OrganisationUnit;

  beforeAll(async () => {
    //await setupTestsConnection();

    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });
    assessmentService = new InnovationAssessmentService(
      process.env.DB_TESTS_NAME
    );

    notificationService = new NotificationService(process.env.DB_TESTS_NAME);

    const innovatorUser = await fixtures.createInnovatorUser();
    const assessmentUser = await fixtures.createAssessmentUser();
    const qualAccessorUser = await fixtures.createAccessorUser();

    const accessorOrganisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );

    const fakeAccessorOrganisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );

    fakeOrganisationUnit = await fixtures.createOrganisationUnit(
      fakeAccessorOrganisation
    );

    const organisationQAccessorUser = await fixtures.addUserToOrganisation(
      qualAccessorUser,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );

    const innovationObj = fixtures.generateInnovation({
      owner: innovatorUser,
      surveyId: "abc",
      organisationShares: [{ id: accessorOrganisation.id }],
    });

    const innovations = await fixtures.saveInnovations(innovationObj);
    innovation = innovations[0];

    innovatorRequestUser = fixtures.getRequestUser(innovatorUser);
    assessmentRequestUser = fixtures.getRequestUser(assessmentUser);
    qAccessorRequestUser = fixtures.getRequestUser(
      qualAccessorUser,
      organisationQAccessorUser
    );
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(OrganisationUser).execute();
    await query.from(Organisation).execute();
    await query.from(Innovation).execute();
    await query.from(User).execute();

    //closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(NotificationUser).execute();
    await query.from(Notification).execute();
    await query.from(Comment).execute();
    await query.from(InnovationAssessment).execute();
  });

  it("should instantiate the innovation assessment service", async () => {
    expect(assessmentService).toBeDefined();
  });

  it("should create an assessment without a comment", async () => {
    const assessmentObj = {
      ...dummy.assessment,
      innovation: innovation.id,
      assignTo: assessmentRequestUser.id,
    };

    const item = await assessmentService.create(
      assessmentRequestUser,
      innovation.id,
      assessmentObj
    );

    expect(item).toBeDefined();
    expect(item.description).toEqual(dummy.assessment.description);
  });

  it("should create an assessment wit a comment", async () => {
    const assessmentObj = {
      ...dummy.assessment,
      innovation: innovation.id,
      assignTo: assessmentRequestUser.id,
      comment: "my assessment comment",
    };

    const item = await assessmentService.create(
      assessmentRequestUser,
      innovation.id,
      assessmentObj
    );

    expect(item).toBeDefined();
    expect(item.description).toEqual(dummy.assessment.description);
  });

  it("should find an assessment by innovation id", async () => {
    spyOn(helpers, "authenticateWitGraphAPI").and.returnValue(":access_token");
    spyOn(helpers, "getUsersFromB2C").and.returnValue([
      {
        id: assessmentRequestUser.id,
        displayName: ":displayName",
      },
    ]);

    const assessmentObj = {
      ...dummy.assessment,
      innovation: innovation.id,
      assignTo: assessmentRequestUser.id,
    };

    const assessment = await assessmentService.create(
      assessmentRequestUser,
      innovation.id,
      assessmentObj
    );

    const item = await assessmentService.find(
      assessmentRequestUser,
      assessment.id,
      innovation.id
    );

    expect(item).toBeDefined();
    expect(item.description).toEqual(dummy.assessment.description);
  });

  it("should update an assessment without submission", async () => {
    const assessmentObj = {
      ...dummy.assessment,
      innovation: innovation.id,
      assignTo: assessmentRequestUser.id,
    };

    const assessment = await assessmentService.create(
      assessmentRequestUser,
      innovation.id,
      assessmentObj
    );

    const updAssessment = {
      maturityLevel: MaturityLevelCatalogue.ADVANCED,
      test: "test",
    };
    const item = await assessmentService.update(
      assessmentRequestUser,
      assessment.id,
      innovation.id,
      updAssessment
    );

    expect(item).toBeDefined();
    expect(item.maturityLevel).toEqual(MaturityLevelCatalogue.ADVANCED);
  });

  it("should update an assessment with submission", async () => {
    const assessmentObj = {
      ...dummy.assessment,
      innovation: innovation.id,
      assignTo: assessmentRequestUser.id,
    };

    const assessment = await assessmentService.create(
      assessmentRequestUser,
      innovation.id,
      assessmentObj
    );

    const updAssessment = {
      maturityLevel: MaturityLevelCatalogue.ADVANCED,
      isSubmission: true,
      test: "test",
    };
    const item = await assessmentService.update(
      assessmentRequestUser,
      assessment.id,
      innovation.id,
      updAssessment
    );

    expect(item).toBeDefined();
    expect(item.maturityLevel).toEqual(MaturityLevelCatalogue.ADVANCED);
    expect(item.finishedAt).toBeDefined();
  });

  it("should update an assessment with submission even when notifications fail", async () => {
    spyOn(NotificationService.prototype, "create").and.throwError("error");
    spyOn(NotificationService.prototype, "sendEmail").and.throwError("error");

    const spy = spyOn(LoggerService.prototype, "error");

    const assessmentObj = {
      ...dummy.assessment,
      innovation: innovation.id,
      assignTo: assessmentRequestUser.id,
    };

    const assessment = await assessmentService.create(
      assessmentRequestUser,
      innovation.id,
      assessmentObj
    );

    const updAssessment = {
      maturityLevel: MaturityLevelCatalogue.ADVANCED,
      isSubmission: true,
      test: "test",
    };
    const item = await assessmentService.update(
      assessmentRequestUser,
      assessment.id,
      innovation.id,
      updAssessment
    );

    expect(item).toBeDefined();
    expect(item.maturityLevel).toEqual(MaturityLevelCatalogue.ADVANCED);
    expect(item.finishedAt).toBeDefined();
    expect(spy).toHaveBeenCalled();
  });

  it("should find an assessment by qualifying accessor", async () => {
    spyOn(helpers, "authenticateWitGraphAPI").and.returnValue(":access_token");
    spyOn(helpers, "getUsersFromB2C").and.returnValue([
      {
        id: assessmentRequestUser.id,
        displayName: ":displayName",
      },
    ]);

    const assessmentObj = {
      ...dummy.assessment,
      innovation: innovation.id,
      assignTo: assessmentRequestUser.id,
    };

    const assessment = await assessmentService.create(
      assessmentRequestUser,
      innovation.id,
      assessmentObj
    );

    const item = await assessmentService.find(
      qAccessorRequestUser,
      assessment.id,
      innovation.id
    );

    expect(item).toBeDefined();
    expect(item.description).toEqual(dummy.assessment.description);
  });

  it("should find an assessment by innovator", async () => {
    spyOn(helpers, "authenticateWitGraphAPI").and.returnValue(":access_token");
    spyOn(helpers, "getUsersFromB2C").and.returnValue([
      {
        id: assessmentRequestUser.id,
        displayName: ":displayName",
      },
    ]);

    const assessmentObj = {
      ...dummy.assessment,
      innovation: innovation.id,
      assignTo: assessmentRequestUser.id,
    };

    const assessment = await assessmentService.create(
      assessmentRequestUser,
      innovation.id,
      assessmentObj
    );

    const item = await assessmentService.find(
      innovatorRequestUser,
      assessment.id,
      innovation.id
    );

    expect(item).toBeDefined();
    expect(item.description).toEqual(dummy.assessment.description);
  });

  it("should update an assessment with submission and create notifications", async () => {
    const assessmentObj = {
      ...dummy.assessment,
      innovation: innovation.id,
      assignTo: assessmentRequestUser.id,
    };

    const assessment = await assessmentService.create(
      assessmentRequestUser,
      innovation.id,
      assessmentObj
    );

    const updAssessment = {
      maturityLevel: MaturityLevelCatalogue.ADVANCED,
      isSubmission: true,
      test: "test",
      organisationUnits: [fakeOrganisationUnit.id],
    };

    spyOn(notificationService, "sendEmail");

    const spy = spyOn(notificationService, "create");

    const item = await assessmentService.update(
      assessmentRequestUser,
      assessment.id,
      innovation.id,
      updAssessment
    );

    expect(item).toBeDefined();
  });
});
