import {
  Innovation,
  InnovationAssessment,
  InnovatorOrganisationRole,
  User,
  UserType,
} from "@domain/index";
import { UserService } from "@services/services/User.service";
import { getConnection } from "typeorm";
import { closeTestsConnection, setupTestsConnection } from "..";
import * as helpers from "../helpers";
import { InnovationService } from "../services/Innovation.service";
import { InnovationAssessmentService } from "../services/InnovationAssessment.service";
import { InnovatorService } from "../services/Innovator.service";

const dummy = {
  innovatorId: "innovatorId",
  assessmentUserId: "assessmentUserId",
  assessment: {
    description: "Assessment Desc",
  },
};

describe("Innovation Assessment Suite", () => {
  let assessmentService: InnovationAssessmentService;
  let innovation: Innovation;
  let userService: UserService;

  beforeAll(async () => {
    // await setupTestsConnection();
    const innovationService = new InnovationService(process.env.DB_TESTS_NAME);
    const innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);

    assessmentService = new InnovationAssessmentService(
      process.env.DB_TESTS_NAME
    );
    userService = new UserService(process.env.DB_TESTS_NAME);

    const innovator = new User();
    innovator.id = dummy.innovatorId;
    const innovatorUser = await innovatorService.create(innovator);

    const innovationObj = Innovation.new({
      owner: innovatorUser,
      surveyId: "abc",
      name: "My Innovation",
      description: "My Description",
      countryName: "UK",
    });
    innovation = await innovationService.create(innovationObj);

    const assessmentUser = new User();
    assessmentUser.id = dummy.assessmentUserId;
    assessmentUser.type = UserType.ASSESSMENT;
    await userService.create(assessmentUser);
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(Innovation).execute();
    await query.from(User).execute();

    // closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(InnovationAssessment).execute();
  });

  it("should instantiate the innovation assessment service", async () => {
    expect(assessmentService).toBeDefined();
  });

  it("should create an assessment", async () => {
    const assessmentObj = {
      ...dummy.assessment,
      innovation: innovation.id,
      assignTo: dummy.assessmentUserId,
    };

    const item = await assessmentService.create(
      dummy.innovatorId,
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
      id: dummy.assessmentUserId,
      displayName: ":displayName",
      type: UserType.ASSESSMENT,
      organisations: [],
      email: "test_user@example.com",
      phone: "+351960000000",
    });

    const assessmentObj = {
      ...dummy.assessment,
      innovation: innovation.id,
      assignTo: dummy.assessmentUserId,
    };

    const assessment = await assessmentService.create(
      dummy.assessmentUserId,
      assessmentObj
    );

    const item = await assessmentService.find(assessment.id, innovation.id);

    expect(item).toBeDefined();
    expect(item.description).toEqual(dummy.assessment.description);
  });
});
