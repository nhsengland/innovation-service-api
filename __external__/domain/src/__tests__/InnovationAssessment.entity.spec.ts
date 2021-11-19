import { ActivityLog } from "@domain/index";
import { classToPlain } from "class-transformer";
import { getConnection, getRepository, Repository } from "typeorm";
import { getEntityColumnList } from "../../tools/helpers";
import { Innovation } from "../entity/innovation/Innovation.entity";
import { InnovationAssessment } from "../entity/innovation/InnovationAssessment.entity";
import { Organisation } from "../entity/organisation/Organisation.entity";
import { User } from "../entity/user/User.entity";
import {
  MaturityLevelCatalogue,
  YesPartiallyNoCatalogue,
} from "../enums/catalog.enums";
import { InnovationStatus } from "../enums/innovation.enums";
import { OrganisationType } from "../enums/organisation.enums";
import { UserType } from "../enums/user.enums";

describe("Innovation Action Test Suite", () => {
  let innovationAssessmentRepo: Repository<InnovationAssessment>;
  let innovationRepo: Repository<Innovation>;
  let organisationRepo: Repository<Organisation>;
  let userRepo: Repository<User>;

  let assessmentUser: User;
  let innovation: Innovation;
  let organisation: Organisation;

  beforeAll(async () => {
    innovationAssessmentRepo = getRepository(
      InnovationAssessment,
      process.env.DB_TESTS_NAME
    );
    innovationRepo = getRepository(Innovation, process.env.DB_TESTS_NAME);
    userRepo = getRepository(User, process.env.DB_TESTS_NAME);

    organisationRepo = getRepository(Organisation, process.env.DB_TESTS_NAME);

    let userObj = User.new({
      id: "abc",
      type: UserType.INNOVATOR,
    });
    const user = await userRepo.save(userObj);

    const innovationObj = Innovation.new({
      name: "Innovation A",
      description: "My innovation description",
      countryName: "Wales",
      surveyId: "abc",
      owner: user,
      status: InnovationStatus.CREATED,
    });

    innovation = await innovationRepo.save(innovationObj);

    userObj = User.new({
      id: "assessmentId",
      type: UserType.ASSESSMENT,
    });
    assessmentUser = await userRepo.save(userObj);

    const organisationObj = Organisation.new({
      name: "AccessorOrg",
      size: "huge",
      type: OrganisationType.ACCESSOR,
    });

    organisation = await organisationRepo.save(organisationObj);
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();
    await query.from(ActivityLog).execute();
    await query.from(Organisation).execute();
    await query.from(Innovation).execute();
    await query.from(User).execute();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(InnovationAssessment).execute();
  });

  it("should create an Innovation Assessment with correct properties", async () => {
    // Arrange
    const expectedProps = await getEntityColumnList(InnovationAssessment);

    const innovationAssessmentObj = InnovationAssessment.new({
      description: "New Assessment",
      summary: "Summary",
      maturityLevel: MaturityLevelCatalogue.ADVANCED,
      hasRegulatoryApprovals: YesPartiallyNoCatalogue.YES,
      hasRegulatoryApprovalsComment: "hasRegulatoryApprovalsComment",
      hasEvidence: YesPartiallyNoCatalogue.YES,
      hasEvidenceComment: "hasEvidenceComment",
      hasValidation: YesPartiallyNoCatalogue.YES,
      hasValidationComment: "hasValidationComment",
      hasProposition: YesPartiallyNoCatalogue.YES,
      hasPropositionComment: "hasPropositionComment",
      hasCompetitionKnowledge: YesPartiallyNoCatalogue.YES,
      hasCompetitionKnowledgeComment: "hasCompetitionKnowledgeComment",
      hasImplementationPlan: YesPartiallyNoCatalogue.YES,
      hasImplementationPlanComment: "hasImplementationPlanComment",
      hasScaleResource: YesPartiallyNoCatalogue.YES,
      hasScaleResourceComment: "hasScaleResourceComment",
      organisations: [organisation],
      assignTo: { id: assessmentUser.id },
      innovation,
    });

    const innovationAssessment = await innovationAssessmentRepo.save(
      innovationAssessmentObj
    );

    const actual = await innovationAssessmentRepo.findOne(
      innovationAssessment.id,
      {
        loadRelationIds: true,
      }
    );

    // Assert
    expect(Object.keys(classToPlain(actual))).toEqual(
      expect.arrayContaining(expectedProps)
    );
  });
});
