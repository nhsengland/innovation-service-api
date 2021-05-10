import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import {
  CarePathwayCatalogue,
  CostComparisonCatalogue,
  PatientRangeCatalogue,
} from "../../enums/catalog.enums";
import { Base } from "../Base.entity";

import { Innovation } from "../innovation/Innovation.entity";

@Entity("innovation_subgroup")
export class InnovationSubgroup extends Base {
  //columns
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  conditions: string;

  @Column({ nullable: true })
  benefits: string;

  @Column({ name: "care_pathway", type: "nvarchar", nullable: true })
  carePathway: CarePathwayCatalogue;

  @Column({ name: "cost_description", type: "nvarchar", nullable: true })
  costDescription: string;

  @Column({ name: "patients_range", type: "nvarchar", nullable: true })
  patientsRange: PatientRangeCatalogue;

  @Column({ name: "sell_expectations", type: "nvarchar", nullable: true })
  sellExpectations: string;

  @Column({ name: "usage_expectations", type: "nvarchar", nullable: true })
  usageExpectations: string;

  @Column({ name: "cost_comparison", type: "nvarchar", nullable: true })
  costComparison: CostComparisonCatalogue;

  //relationships
  @ManyToOne(() => Innovation, { nullable: false })
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  //static constructor
  static new(data) {
    const newObj = new InnovationSubgroup();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
