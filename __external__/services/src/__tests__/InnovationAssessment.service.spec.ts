import {
  AccessorOrganisationRole,
  Comment,
  Innovation,
  InnovationAssessment,
  MaturityLevelCatalogue,
  Organisation,
  OrganisationType,
  OrganisationUser,
  User,
  UserType,
} from "@domain/index";
import { RequestUser } from "@services/models/RequestUser";
import { UserService } from "@services/services/User.service";
import { getConnection } from "typeorm";
import { closeTestsConnection, setupTestsConnection } from "..";
import * as helpers from "../helpers";
import { InnovationAssessmentService } from "../services/InnovationAssessment.service";
import * as fixtures from "../__fixtures__";

const dummy = {
  assessment: {
    description: "Assessment Desc",
  },
};

describe("Innovation Assessment Suite", () => {
  let assessmentService: InnovationAssessmentService;
  let userService: UserService;
  let innovation: Innovation;

  let assessmentRequestUser: RequestUser;
  let innovatorRequestUser: RequestUser;
  let qAccessorRequestUser: RequestUser;

  beforeAll(async () => {
    // await setupTestsConnection();

    assessmentService = new InnovationAssessmentService(
      process.env.DB_TESTS_NAME
    );
    userService = new UserService(process.env.DB_TESTS_NAME);

    const innovatorUser = await fixtures.createInnovatorUser();
    const assessmentUser = await fixtures.createAssessmentUser();
    const qualAccessorUser = await fixtures.createAccessorUser();

    const accessorOrganisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
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

    // closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

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
      id: assessmentRequestUser.id,
      displayName: ":displayName",
      type: UserType.ASSESSMENT,
      organisations: [],
      email: "test_user@example.com",
      phone: "+351960000000",
    });

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

  it("should find an assessment by qualifying accessor", async () => {
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
      id: assessmentRequestUser.id,
      displayName: ":displayName",
      type: UserType.ASSESSMENT,
      organisations: [],
      email: "test_user@example.com",
      phone: "+351960000000",
    });

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
      id: assessmentRequestUser.id,
      displayName: ":displayName",
      type: UserType.ASSESSMENT,
      organisations: [],
      email: "test_user@example.com",
      phone: "+351960000000",
    });

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
});
