import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import {
  MaturityLevelCatalogue,
  YesPartiallyNoCatalogue,
} from "../../enums/catalog.enums";
import { Base } from "../Base.entity";
import { OrganisationUnit } from "../organisation/OrganisationUnit.entity";
import { User } from "../user/User.entity";
import { Innovation } from "./Innovation.entity";

@Entity("innovation_assessment")
export class InnovationAssessment extends Base {
  // columns
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "description", nullable: true })
  description: string;

  @Column({ name: "summary", nullable: true })
  summary: string;

  @Column({
    name: "maturity_level",
    type: "nvarchar",
    nullable: true,
    length: 20,
  })
  maturityLevel: MaturityLevelCatalogue;

  @Column({ name: "finished_at", nullable: true })
  finishedAt: Date;

  @Column({
    name: "has_regulatory_approvals",
    type: "nvarchar",
    nullable: true,
    length: 20,
  })
  hasRegulatoryApprovals: YesPartiallyNoCatalogue;

  @Column({
    name: "has_regulatory_approvals_comment",
    nullable: true,
    length: 150,
  })
  hasRegulatoryApprovalsComment: string;

  @Column({
    name: "has_evidence",
    type: "nvarchar",
    nullable: true,
    length: 20,
  })
  hasEvidence: YesPartiallyNoCatalogue;

  @Column({ name: "has_evidence_comment", nullable: true })
  hasEvidenceComment: string;

  @Column({
    name: "has_validation",
    type: "nvarchar",
    nullable: true,
    length: 20,
  })
  hasValidation: YesPartiallyNoCatalogue;

  @Column({ name: "has_validation_comment", nullable: true })
  hasValidationComment: string;

  @Column({
    name: "has_proposition",
    type: "nvarchar",
    nullable: true,
    length: 20,
  })
  hasProposition: YesPartiallyNoCatalogue;

  @Column({ name: "has_proposition_comment", nullable: true })
  hasPropositionComment: string;

  @Column({
    name: "has_competition_knowledge",
    type: "nvarchar",
    nullable: true,
    length: 20,
  })
  hasCompetitionKnowledge: YesPartiallyNoCatalogue;

  @Column({
    name: "has_competition_knowledge_comment",
    nullable: true,
    length: 150,
  })
  hasCompetitionKnowledgeComment: string;

  @Column({
    name: "has_implementation_plan",
    type: "nvarchar",
    nullable: true,
    length: 20,
  })
  hasImplementationPlan: YesPartiallyNoCatalogue;

  @Column({
    name: "has_implementation_plan_comment",
    nullable: true,
    length: 150,
  })
  hasImplementationPlanComment: string;

  @Column({
    name: "has_scale_resource",
    type: "nvarchar",
    nullable: true,
    length: 20,
  })
  hasScaleResource: YesPartiallyNoCatalogue;

  @Column({ name: "has_scale_resource_comment", nullable: true })
  hasScaleResourceComment: string;

  // relationships
  @ManyToOne(() => Innovation, { nullable: false })
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "assign_to_id" })
  assignTo: User;

  @ManyToMany(
    () => OrganisationUnit,
    (record) => record.innovationAssessments,
    {
      nullable: true,
    }
  )
  @JoinTable({
    name: "innovation_assessment_organisation_unit",
    joinColumn: {
      name: "innovation_assessment_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "organisation_unit_id",
      referencedColumnName: "id",
    },
  })
  organisationUnits: OrganisationUnit[];

  //static constructor
  static new(data) {
    const newObj = new InnovationAssessment();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
