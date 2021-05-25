import { Innovation, InnovationAssessment, User } from "@domain/index";
import { getConnection } from "typeorm";
import { closeTestsConnection, setupTestsConnection } from "..";
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

  beforeAll(async () => {
    // await setupTestsConnection();
    const innovationService = new InnovationService(process.env.DB_TESTS_NAME);
    const innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
    assessmentService = new InnovationAssessmentService(
      process.env.DB_TESTS_NAME
    );

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
    const assessment = InnovationAssessment.new({
      ...dummy.assessment,
    });

    const item = await assessmentService.create(
      innovation.id,
      dummy.innovatorId,
      assessment
    );

    expect(item).toBeDefined();
  });
});
