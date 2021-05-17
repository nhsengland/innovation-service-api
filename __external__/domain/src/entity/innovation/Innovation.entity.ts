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
import { InnovationStatus } from "../../enums/innovation.enums";

import { Base } from "../Base.entity";
import { Comment } from "../user/Comment.entity";
import { Organisation } from "../organisation/Organisation.entity";
import { User } from "../user/User.entity";
import {
  HasKnowledgeCatalogue,
  HasFundingCatalogue,
  HasMarketResearchCatalogue,
  HasPatentsCatalogue,
  HasRegulationKnowledegeCatalogue,
  HasResourcesToScaleCatalogue,
  HasSubgroupsCatalogue,
  HasTestsCatalogue,
  InnovationPathwayKnowledgeCatalogue,
  MainPurposeCatalogue,
  YesOrNoCatalogue,
} from "../../enums/catalog.enums";
import { InnovationSubgroup } from "./InnovationSubgroup.entity";
import { InnovationSection } from "./InnovationSection.entity";
import { InnovationArea } from "./InnovationArea.entity";
import { InnovationCareSetting } from "./InnovationCareSetting.entity";
import { InnovationCategory } from "./InnovationCategory.entity";
import { InnovationClinicalArea } from "./InnovationClinicalArea.entity";
import { InnovationDeploymentPlan } from "./InnovationDeploymentPlan.entity";
import { InnovationEvidence } from "./InnovationEvidence.entity";
import { InnovationStandard } from "./InnovationStandard.entity";
import { InnovationRevenue } from "./InnovationRevenue.entity";
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

  @Column({ name: "survey_id", unique: true })
  surveyId: string;

  @Column({ name: "description", nullable: true })
  description: string;

  @Column({ name: "country_name", length: 100 })
  countryName: string;

  @Column({ name: "postcode", nullable: true, length: 20 })
  postcode: string;

  @Column({ name: "other_category_description", nullable: true })
  otherCategoryDescription: string;

  @Column({ name: "has_final_product", type: "nvarchar", nullable: true })
  hasFinalProduct: YesOrNoCatalogue;

  @Column({ name: "main_purpose", type: "nvarchar", nullable: true })
  mainPurpose: MainPurposeCatalogue;

  @Column({ name: "problems_tackled", nullable: true })
  problemsTackled: string;

  @Column({ name: "problems_consequences", nullable: true })
  problemsConsequences: string;

  @Column({ name: "intervention", nullable: true })
  intervention: string;

  @Column({ name: "intervention_impact", nullable: true })
  interventionImpact: string;

  @Column({ name: "has_subgroups", type: "nvarchar", nullable: true })
  hasSubgroups: HasSubgroupsCatalogue;

  @Column({ name: "has_benefits", type: "nvarchar", nullable: true })
  hasBenefits: YesOrNoCatalogue;

  @Column({ name: "benefits", nullable: true })
  benefits: string;

  @Column({ name: "has_evidence", type: "nvarchar", nullable: true })
  hasEvidence: YesOrNoCatalogue;

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
  hasUKPathwayKnowledge: YesOrNoCatalogue;

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

  @OneToMany(() => Comment, (record) => record.innovation, { lazy: true })
  comments: Comment[];

  // static constructor
  static new(data) {
    const newObj = new Innovation();
    newObj.status = InnovationStatus.WAITING_NEEDS_ASSESSMENT;

    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
