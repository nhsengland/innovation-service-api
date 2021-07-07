import { Repository, getRepository, getConnection } from "typeorm";
import { getEntityColumnList } from "../../tools/helpers";
import { classToPlain } from "class-transformer";
import { Innovation, InnovationEvidence, User } from "..";
import { Comment } from "../entity/user/Comment.entity";
import { Organisation } from "../entity/organisation/Organisation.entity";
import { OrganisationUnit } from "../entity/organisation/OrganisationUnit.entity";
import { InnovationSupport } from "../entity/innovation/InnovationSupport.entity";
import { UserType } from "../enums/user.enums";
import {
  InnovationSectionCatalogue,
  InnovationSectionStatus,
  InnovationStatus,
} from "../enums/innovation.enums";
import { OrganisationType } from "../enums/organisation.enums";
import {
  HasMarketResearchCatalogue,
  StandardMetCatalogue,
  HasPatentsCatalogue,
  HasRegulationKnowledegeCatalogue,
  HasSubgroupsCatalogue,
  HasTestsCatalogue,
  MainPurposeCatalogue,
  YesOrNoCatalogue,
  HasKnowledgeCatalogue,
  HasFundingCatalogue,
  HasResourcesToScaleCatalogue,
  InnovationAreaCatalogue,
  InnovationCareSettingCatalogue,
  InnovationCategoryCatalogue,
  InnovationClinicalAreaCatalogue,
  EvidenceTypeCatalogue,
  ClinicalEvidenceTypeCatalogue,
  InnovationStandardCatologue,
  InnovationRevenueTypeCatalogue,
  CarePathwayCatalogue,
  PatientRangeCatalogue,
  CostComparisonCatalogue,
} from "../enums/catalog.enums";
import { InnovationArea } from "../entity/innovation/InnovationArea.entity";
import { InnovationCareSetting } from "../entity/innovation/InnovationCareSetting.entity";
import { InnovationCategory } from "../entity/innovation/InnovationCategory.entity";
import { InnovationClinicalArea } from "../entity/innovation/InnovationClinicalArea.entity";
import { InnovationDeploymentPlan } from "../entity/innovation/InnovationDeploymentPlan.entity";
import { InnovationStandard } from "../entity/innovation/InnovationStandard.entity";
import { InnovationRevenue } from "../entity/innovation/InnovationRevenue.entity";
import { InnovationUserTest } from "../entity/innovation/InnovationUserTest.entity";
import { InnovationSubgroup } from "../entity/innovation/InnovationSubgroup.entity";
import { InnovationSection } from "../entity/innovation/InnovationSection.entity";
import { InnovationFile } from "../entity/innovation/InnovationFile.entity";

const dummy = {
  subgroup: {
    name: "name",
    conditions: "conditions",
    benefits: "benefits",
    carePathway: CarePathwayCatalogue.FIT_LESS_COSTS,
    costDescription: "cost description",
    patientsRange: PatientRangeCatalogue.BETWEEN_10000_500000,
    sellExpectations: "sell expectations",
    usageExpectations: "usage expectations",
    costComparison: CostComparisonCatalogue.CHEAPER,
  },
};
describe("Innovation Test Suite", () => {
  let commentRepo: Repository<Comment>;
  let innovationRepo: Repository<Innovation>;
  let organisationRepo: Repository<Organisation>;
  let userRepo: Repository<User>;
  let user: User;

  beforeAll(async () => {
    commentRepo = getRepository(Comment, process.env.DB_TESTS_NAME);
    innovationRepo = getRepository(Innovation, process.env.DB_TESTS_NAME);
    organisationRepo = getRepository(Organisation, process.env.DB_TESTS_NAME);
    userRepo = getRepository(User, process.env.DB_TESTS_NAME);

    const userObj = User.new({
      id: "abc",
      type: UserType.INNOVATOR,
    });
    user = await userRepo.save(userObj);
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(User).execute();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(InnovationFile).execute();
    await query.from(InnovationSection).execute();
    await query.from(InnovationSupport).execute();
    await query.from(Comment).execute();
    await query.from(InnovationSubgroup).execute();
    await query.from(InnovationArea).execute();
    await query.from(InnovationCareSetting).execute();
    await query.from(InnovationCategory).execute();
    await query.from(InnovationClinicalArea).execute();
    await query.from(InnovationDeploymentPlan).execute();
    await query.from(InnovationEvidence).execute();
    await query.from(InnovationStandard).execute();
    await query.from(InnovationRevenue).execute();
    await query.from(InnovationUserTest).execute();
    await query.from(Innovation).execute();
    await query.from(OrganisationUnit).execute();
    await query.from(Organisation).execute();
  });

  describe("Innovation Suite", () => {
    it("should get an Innovation with correct properties", async () => {
      // Arrange
      const expectedProps = await getEntityColumnList(Innovation);

      const innovation = Innovation.new({
        name: "Innovation A",
        description: "My innovation description",
        countryName: "Wales",
        surveyId: "abc",
        owner: user,
        status: InnovationStatus.WAITING_NEEDS_ASSESSMENT,
      });

      const result = await innovationRepo.save(innovation);

      // Act

      const actual = await innovationRepo.findOne(result.id, {
        loadRelationIds: true,
      });

      // Assert

      expect(Object.keys(classToPlain(actual))).toEqual(
        expect.arrayContaining(expectedProps)
      );
    });

    it("should get an Innovation with comments", async () => {
      // Arrange
      const innovationObj = Innovation.new({
        name: "Innovation A",
        description: "My innovation description",
        countryName: "Wales",
        surveyId: "abc",
        owner: user,
        status: InnovationStatus.WAITING_NEEDS_ASSESSMENT,
      });

      const innovation = await innovationRepo.save(innovationObj);

      const commentObj = Comment.new({
        message: "beautiful",
        user,
        innovation,
      });

      await commentRepo.save(commentObj);

      // Act
      const actual = await innovationRepo.findOne(innovation.id);
      const result = await actual.comments;

      // Assert
      expect(result.length).toBeGreaterThan(0);
    });

    it("should get an InnovationShare with correct properties", async () => {
      // Arrange
      const expectedProps = await getEntityColumnList(Innovation);

      const organisationObj = Organisation.new({
        name: "AccessorOrg",
        size: "huge",
        type: OrganisationType.ACCESSOR,
      });
      const organisation = await organisationRepo.save(organisationObj);

      const innovation = Innovation.new({
        name: "Innovation A",
        description: "My innovation description",
        countryName: "Wales",
        surveyId: "abc",
        owner: user,
        organisationShares: [organisation],
        status: InnovationStatus.WAITING_NEEDS_ASSESSMENT,
      });

      const result = await innovationRepo.save(innovation);

      // Act
      const actual = await innovationRepo.findOne(result.id, {
        loadRelationIds: true,
      });
      const organisationShares = actual.organisationShares;

      // Assert

      expect(Object.keys(classToPlain(actual))).toEqual(
        expect.arrayContaining(expectedProps)
      );
      expect(organisationShares.length).toEqual(1);
    });

    it("should get an InnovationShare with correct properties only with ids", async () => {
      // Arrange
      const expectedProps = await getEntityColumnList(Innovation);

      const organisationObj = Organisation.new({
        name: "AccessorOrg",
        size: "huge",
        type: OrganisationType.ACCESSOR,
      });
      const organisation = await organisationRepo.save(organisationObj);

      const innovation = Innovation.new({
        name: "Innovation A",
        description: "My innovation description",
        countryName: "Wales",
        surveyId: "abc",
        owner: user,
        organisationShares: [{ id: organisation.id }],
        status: InnovationStatus.WAITING_NEEDS_ASSESSMENT,
      });

      let result = await innovationRepo.save(innovation);
      result = await innovationRepo.save(result);

      // Act
      const actual = await innovationRepo.findOne(result.id, {
        loadRelationIds: true,
      });

      const organisationShares = actual.organisationShares;

      // Assert

      expect(Object.keys(classToPlain(actual))).toEqual(
        expect.arrayContaining(expectedProps)
      );
      expect(organisationShares.length).toEqual(1);
    });

    it("should create and get an Innovation with all properties", async () => {
      // Arrange
      const expectedProps = await getEntityColumnList(Innovation);

      const organisationObj = Organisation.new({
        name: "AccessorOrg",
        size: "huge",
        type: OrganisationType.ACCESSOR,
      });
      const organisation = await organisationRepo.save(organisationObj);

      const innovationArea = InnovationArea.new({
        type: InnovationAreaCatalogue.COVID_19,
      });

      const innovationCareSettings = InnovationCareSetting.new({
        type: InnovationCareSettingCatalogue.COMMUNITY,
      });

      const innovationCategory = InnovationCategory.new({
        type: InnovationCategoryCatalogue.AI,
      });

      const innovationClinicalArea = InnovationClinicalArea.new({
        type: InnovationClinicalAreaCatalogue.ACUTE,
      });

      const innovationDeploymentPlan = InnovationDeploymentPlan.new({
        name: "name",
        comercialBasis: "comercial bases",
        orgDeploymentAffect: "org deployment affect",
      });

      const innovationEvidence = InnovationEvidence.new({
        summary: "Some summary here",
        evidenceType: EvidenceTypeCatalogue.CLINICAL,
        clinicalEvidenceType: ClinicalEvidenceTypeCatalogue.DATA_PUBLISHED,
        description: "Here is the test description",
      });

      const innovationStandards = InnovationStandard.new({
        type: InnovationStandardCatologue.OTHER,
        hasMet: StandardMetCatalogue.YES,
      });

      const innovationRevenue = InnovationRevenue.new({
        type: InnovationRevenueTypeCatalogue.SALES_OF_CONSUMABLES_OR_ACCESSORIES,
      });

      const innovationUserTests = InnovationUserTest.new({
        kind: "This is my user test",
        feedback: "This is my feedback for the user test",
      });

      const innovationObj = Innovation.new({
        name: "Innovation A",
        status: InnovationStatus.IN_PROGRESS,
        surveyId: "abc",
        description: "My innovation description",
        countryName: "Wales",
        postcode: "000",
        otherCategoryDescription: "other category description",
        hasFinalProduct: YesOrNoCatalogue.YES,
        mainPurpose: MainPurposeCatalogue.ENABLING_CARE,
        problemsTackled: "problems tackled",
        problemsConsequences: "problems consequences",
        intervention: "intervention",
        interventionImpact: "intervention impact",
        hasSubgroups: HasSubgroupsCatalogue.YES,
        hasBenefits: YesOrNoCatalogue.YES,
        benefits: "benefits",
        hasEvidence: YesOrNoCatalogue.YES,
        hasMarketResearch: HasMarketResearchCatalogue.YES,
        marketResearch: "market research",
        hasPatents: HasPatentsCatalogue.APPLIED_AT_LEAST_ONE,
        hasOtherIntellectual: YesOrNoCatalogue.YES,
        otherIntellectual: "other intellectual",
        hasRegulationKnowledge: HasRegulationKnowledegeCatalogue.YES_ALL,
        otherRegulationDescription: "other regulation description",
        hasUKPathwayKnowledge: YesOrNoCatalogue.YES,
        innovationPathwayKnowledge: YesOrNoCatalogue.YES,
        potentialPathway: "potential pathway",
        hasTests: HasTestsCatalogue.YES,
        hasCostKnowledge: HasKnowledgeCatalogue.DETAILED_ESTIMATE,
        hasCostSavingKnowledge: HasKnowledgeCatalogue.DETAILED_ESTIMATE,
        hasCostCareKnowledge: HasKnowledgeCatalogue.DETAILED_ESTIMATE,
        hasRevenueModel: YesOrNoCatalogue.YES,
        payingOrganisations: "paying organisations",
        benefittingOrganisations: "benefitting organisations",
        hasFunding: HasFundingCatalogue.YES,
        fundingDescription: "funding description",
        hasDeployPlan: YesOrNoCatalogue.YES,
        isDeployed: YesOrNoCatalogue.YES,
        hasResourcesToScale: HasResourcesToScaleCatalogue.YES,
        owner: user,
        areas: [innovationArea],
        careSettings: [innovationCareSettings],
        categories: [innovationCategory],
        clinicalAreas: [innovationClinicalArea],
        deploymentPlans: [innovationDeploymentPlan],
        evidence: [innovationEvidence],
        standards: [innovationStandards],
        revenues: [innovationRevenue],
        subgroups: [InnovationSubgroup.new(dummy.subgroup)],
        userTests: [innovationUserTests],
        organisationShares: [organisation],
      });

      const result = await innovationRepo.save(innovationObj);

      // Act
      const actual = await innovationRepo.findOne(result.id, {
        relations: ["owner"],
      });

      // Assert
      expect(Object.keys(classToPlain(actual))).toEqual(
        expect.arrayContaining(expectedProps)
      );
    });

    it("should update a subgroup when a subgroup is edited", async () => {
      const innovationObj = Innovation.new({
        name: "Innovation A",
        description: "My innovation description",
        countryName: "Wales",
        surveyId: "abc",
        owner: user,
        subgroups: [InnovationSubgroup.new(dummy.subgroup)],
        status: InnovationStatus.IN_PROGRESS,
      });
      let innovation = await innovationRepo.save(innovationObj);

      // Act
      const innovationDb = await innovationRepo.findOne(innovation.id, {
        relations: ["owner"],
      });
      const subgroups = await innovationDb.subgroups;
      const newSubGroupName = "my new name";
      subgroups[0].name = newSubGroupName;
      innovationDb.subgroups = subgroups;

      innovation = await innovationRepo.save(innovationDb);
      const actual = await innovation.subgroups;

      // Assert
      expect(actual.length).toEqual(1);
      expect(actual[0].name).toEqual(newSubGroupName);
    });

    it("should find all innovation sections with all properties", async () => {
      const sectionObj = InnovationSection.new({
        section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
        status: InnovationSectionStatus.DRAFT,
        submittedAt: new Date(),
      });

      const innovationObj = Innovation.new({
        name: "Innovation A",
        description: "My innovation description",
        countryName: "Wales",
        surveyId: "abc",
        owner: user,
        sections: [sectionObj],
        status: InnovationStatus.IN_PROGRESS,
      });
      let innovation = await innovationRepo.save(innovationObj);

      // Act
      innovation = await innovationRepo.findOne(innovation.id, {
        relations: ["owner"],
      });
      const sections = await innovation.sections;

      const innovationSections = [];
      for (const key in InnovationSectionCatalogue) {
        const section = sections.find((sec) => sec.section === key);
        if (section) {
          innovationSections.push({
            id: section.id,
            section: section.section,
            status: section.status,
          });
        } else {
          innovationSections.push({
            id: null,
            section: key,
            status: InnovationSectionStatus.NOT_STARTED,
          });
        }
      }

      // Assert
      expect(innovationSections.length).toEqual(14);
    });
  });
});
