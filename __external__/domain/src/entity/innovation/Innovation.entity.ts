import { InnovationSupport } from "@domain/index";
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import {
  CostComparisonCatalogue,
  HasBenefitsCatalogue,
  HasEvidenceCatalogue,
  HasFundingCatalogue,
  HasKnowledgeCatalogue,
  HasMarketResearchCatalogue,
  HasPatentsCatalogue,
  HasProblemTackleKnowledgeCatalogue,
  HasRegulationKnowledegeCatalogue,
  HasResourcesToScaleCatalogue,
  HasTestsCatalogue,
  InnovationCategoryCatalogue,
  InnovationPathwayKnowledgeCatalogue,
  MainPurposeCatalogue,
  YesNoNotRelevantCatalogue,
  YesOrNoCatalogue,
} from "../../enums/catalog.enums";
import { InnovationStatus } from "../../enums/innovation.enums";
import { Base } from "../Base.entity";
import { Organisation } from "../organisation/Organisation.entity";
import { Comment } from "../user/Comment.entity";
import { User } from "../user/User.entity";
import { InnovationArea } from "./InnovationArea.entity";
import { InnovationAssessment } from "./InnovationAssessment.entity";
import { InnovationCareSetting } from "./InnovationCareSetting.entity";
import { InnovationCategory } from "./InnovationCategory.entity";
import { InnovationClinicalArea } from "./InnovationClinicalArea.entity";
import { InnovationDeploymentPlan } from "./InnovationDeploymentPlan.entity";
import { InnovationEnvironmentalBenefit } from "./InnovationEnvironmentalBenefit.entity";
import { InnovationEvidence } from "./InnovationEvidence.entity";
import { InnovationGeneralBenefit } from "./InnovationGeneralBenefit.entity";
import { InnovationPatientsCitizensBenefit } from "./InnovationPatientsCitizensBenefit.entity";
import { InnovationRevenue } from "./InnovationRevenue.entity";
import { InnovationSection } from "./InnovationSection.entity";
import { InnovationStandard } from "./InnovationStandard.entity";
import { InnovationSubgroup } from "./InnovationSubgroup.entity";
import { InnovationSupportType } from "./InnovationSupportType.entity";
import { InnovationUserTest } from "./InnovationUserTest.entity";

@Entity("innovation")
export class Innovation extends Base {
  // columns
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "name", length: 100 })
  name: string;

  @Column({
    type: "simple-enum",
    enum: InnovationStatus,
    nullable: false,
  })
  status: InnovationStatus;

  @Column({ name: "survey_id", unique: true, nullable: true })
  surveyId: string;

  @Column({ name: "description", nullable: true })
  description: string;

  @Column({ name: "more_support_description", nullable: true })
  moreSupportDescription: string;

  @Column({ name: "country_name", length: 100 })
  countryName: string;

  @Column({ name: "postcode", nullable: true, length: 20 })
  postcode: string;

  @Column({ name: "submitted_at", nullable: true })
  submittedAt: Date;

  @Column({ name: "other_main_category_description", nullable: true })
  otherMainCategoryDescription: string;

  @Column({ name: "other_category_description", nullable: true })
  otherCategoryDescription: string;

  @Column({ name: "main_category", nullable: true })
  mainCategory: InnovationCategoryCatalogue;

  @Column({ name: "has_final_product", type: "nvarchar", nullable: true })
  hasFinalProduct: YesOrNoCatalogue;

  @Column({ name: "main_purpose", type: "nvarchar", nullable: true })
  mainPurpose: MainPurposeCatalogue;

  @Column({
    name: "has_problem_tackle_knowledge",
    type: "nvarchar",
    nullable: true,
  })
  hasProblemTackleKnowledge: HasProblemTackleKnowledgeCatalogue;

  @Column({ name: "problems_tackled", nullable: true })
  problemsTackled: string;

  @Column({ name: "problems_consequences", nullable: true })
  problemsConsequences: string;

  @Column({ name: "intervention", nullable: true })
  intervention: string;

  @Column({ name: "intervention_impact", nullable: true })
  interventionImpact: string;

  @Column({ name: "has_benefits", type: "nvarchar", nullable: true })
  hasBenefits: HasBenefitsCatalogue;

  @Column({ name: "has_evidence", type: "nvarchar", nullable: true })
  hasEvidence: HasEvidenceCatalogue;

  @Column({ name: "has_market_research", type: "nvarchar", nullable: true })
  hasMarketResearch: HasMarketResearchCatalogue;

  @Column({ name: "market_research", nullable: true })
  marketResearch: string;

  @Column({ name: "has_patents", type: "nvarchar", nullable: true })
  hasPatents: HasPatentsCatalogue;

  @Column({ name: "has_other_intellectual", type: "nvarchar", nullable: true })
  hasOtherIntellectual: YesOrNoCatalogue;

  @Column({ name: "other_intellectual", nullable: true })
  otherIntellectual: string;

  @Column({ name: "impact_patients", nullable: true, default: false })
  impactPatients: boolean;

  @Column({ name: "impact_clinicians", nullable: true, default: false })
  impactClinicians: boolean;

  @Column({
    name: "has_regulation_knowledge",
    type: "nvarchar",
    nullable: true,
  })
  hasRegulationKnowledge: HasRegulationKnowledegeCatalogue;

  @Column({ name: "other_regulation_description", nullable: true })
  otherRegulationDescription: string;

  @Column({
    name: "has_uk_pathway_knowledge",
    type: "nvarchar",
    nullable: true,
  })
  hasUKPathwayKnowledge: YesNoNotRelevantCatalogue;

  @Column({
    name: "innovation_pathway_knowledge",
    type: "nvarchar",
    nullable: true,
  })
  innovationPathwayKnowledge: InnovationPathwayKnowledgeCatalogue;

  @Column({ name: "potential_pathway", nullable: true })
  potentialPathway: string;

  @Column({ name: "has_tests", type: "nvarchar", nullable: true })
  hasTests: HasTestsCatalogue;

  @Column({ name: "has_cost_knowledge", type: "nvarchar", nullable: true })
  hasCostKnowledge: HasKnowledgeCatalogue;

  @Column({
    name: "has_cost_saving_knowledge",
    type: "nvarchar",
    nullable: true,
  })
  hasCostSavingKnowledge: HasKnowledgeCatalogue;

  @Column({ name: "has_cost_care_knowledge", type: "nvarchar", nullable: true })
  hasCostCareKnowledge: HasKnowledgeCatalogue;

  @Column({ name: "has_revenue_model", type: "nvarchar", nullable: true })
  hasRevenueModel: YesOrNoCatalogue;

  @Column({ name: "other_revenue_description", nullable: true })
  otherRevenueDescription: string;

  @Column({ name: "paying_organisations", nullable: true })
  payingOrganisations: string;

  @Column({ name: "benefitting_organisations", nullable: true })
  benefittingOrganisations: string;

  @Column({ name: "has_funding", type: "nvarchar", nullable: true })
  hasFunding: HasFundingCatalogue;

  @Column({ name: "funding_description", nullable: true })
  fundingDescription: string;

  @Column({ name: "has_deploy_plan", type: "nvarchar", nullable: true })
  hasDeployPlan: YesOrNoCatalogue;

  @Column({ name: "is_deployed", type: "nvarchar", nullable: true })
  isDeployed: YesOrNoCatalogue;

  @Column({ name: "has_resources_to_scale", type: "nvarchar", nullable: true })
  hasResourcesToScale: HasResourcesToScaleCatalogue;

  @Column({ name: "cost_description", type: "nvarchar", nullable: true })
  costDescription: string;

  @Column({ name: "sell_expectations", type: "nvarchar", nullable: true })
  sellExpectations: string;

  @Column({ name: "usage_expectations", type: "nvarchar", nullable: true })
  usageExpectations: string;

  @Column({ name: "cost_comparison", type: "nvarchar", nullable: true })
  costComparison: CostComparisonCatalogue;

  @Column({ name: "care_pathway", type: "nvarchar", nullable: true })
  carePathway: string;

  @Column({ name: "patients_range", type: "nvarchar", nullable: true })
  patientsRange: string;

  @Column({
    name: "clinicians_impact_details",
    type: "nvarchar",
    nullable: true,
  })
  cliniciansImpactDetails: string;

  @Column({
    name: "accessibility_impact_details",
    type: "nvarchar",
    nullable: true,
  })
  accessibilityImpactDetails: string;

  @Column({
    name: "accessibility_steps_details",
    type: "nvarchar",
    nullable: true,
  })
  accessibilityStepsDetails: string;

  @Column({
    name: "other_patients_citizens_benefit",
    type: "nvarchar",
    nullable: true,
  })
  otherPatientsCitizensBenefit: string;

  @Column({ name: "other_general_benefit", type: "nvarchar", nullable: true })
  otherGeneralBenefit: string;

  @Column({
    name: "other_environmental_benefit",
    type: "nvarchar",
    nullable: true,
  })
  otherEnvironmentalBenefit: string;

  @Column({ name: "archive_reason", type: "nvarchar", nullable: true })
  archiveReason: string;

  // relationships
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "owner_id" })
  owner: User;

  @ManyToMany(() => Organisation, (record) => record.innovationShares, {
    nullable: true,
  })
  @JoinTable({
    name: "innovation_share",
    joinColumn: {
      name: "innovation_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "organisation_id",
      referencedColumnName: "id",
    },
  })
  organisationShares: Organisation[];

  @OneToMany(() => InnovationAssessment, (record) => record.innovation, {
    //lazy: true,
    cascade: ["insert", "update"],
  })
  assessments: InnovationAssessment[];

  @OneToMany(() => InnovationSection, (record) => record.innovation, {
    lazy: true,
    cascade: ["insert", "update"],
  })
  sections: InnovationSection[];

  @OneToMany(() => InnovationSubgroup, (record) => record.innovation, {
    lazy: true,
    cascade: ["insert", "update"],
  })
  subgroups: InnovationSubgroup[];

  @OneToMany(() => InnovationArea, (record) => record.innovation, {
    lazy: true,
    cascade: ["insert", "update"],
  })
  areas: InnovationArea[];

  @OneToMany(() => InnovationCareSetting, (record) => record.innovation, {
    lazy: true,
    cascade: ["insert", "update"],
  })
  careSettings: InnovationCareSetting[];

  @OneToMany(() => InnovationCategory, (record) => record.innovation, {
    lazy: true,
    cascade: ["insert", "update"],
  })
  categories: InnovationCategory[];

  @OneToMany(() => InnovationClinicalArea, (record) => record.innovation, {
    lazy: true,
    cascade: ["insert", "update"],
  })
  clinicalAreas: InnovationClinicalArea[];

  @OneToMany(() => InnovationDeploymentPlan, (record) => record.innovation, {
    lazy: true,
    cascade: ["insert", "update"],
  })
  deploymentPlans: InnovationDeploymentPlan[];

  @OneToMany(() => InnovationEvidence, (record) => record.innovation, {
    lazy: true,
    cascade: ["insert", "update"],
  })
  evidence: InnovationEvidence[];

  @OneToMany(() => InnovationStandard, (record) => record.innovation, {
    lazy: true,
    cascade: ["insert", "update"],
  })
  standards: InnovationStandard[];

  @OneToMany(() => InnovationRevenue, (record) => record.innovation, {
    lazy: true,
    cascade: ["insert", "update"],
  })
  revenues: InnovationRevenue[];

  @OneToMany(() => InnovationUserTest, (record) => record.innovation, {
    lazy: true,
    cascade: ["insert", "update"],
  })
  userTests: InnovationUserTest[];

  @OneToMany(() => InnovationSupportType, (record) => record.innovation, {
    lazy: true,
    cascade: ["insert", "update"],
  })
  supportTypes: InnovationSupportType[];

  @OneToMany(() => InnovationGeneralBenefit, (record) => record.innovation, {
    lazy: true,
    cascade: ["insert", "update"],
  })
  generalBenefits: InnovationGeneralBenefit[];

  @OneToMany(
    () => InnovationEnvironmentalBenefit,
    (record) => record.innovation,
    {
      lazy: true,
      cascade: ["insert", "update"],
    }
  )
  environmentalBenefits: InnovationEnvironmentalBenefit[];

  @OneToMany(
    () => InnovationPatientsCitizensBenefit,
    (record) => record.innovation,
    {
      lazy: true,
      cascade: ["insert", "update"],
    }
  )
  patientsCitizensBenefits: InnovationPatientsCitizensBenefit[];

  @OneToMany(() => Comment, (record) => record.innovation, { lazy: true })
  comments: Comment[];

  @OneToMany(() => InnovationSupport, (support) => support.innovation, {
    //lazy: true,
    cascade: ["insert", "update"],
  })
  innovationSupports: InnovationSupport[];

  // static constructor
  static new(data) {
    const newObj = new Innovation();
    newObj.status = InnovationStatus.CREATED;

    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
