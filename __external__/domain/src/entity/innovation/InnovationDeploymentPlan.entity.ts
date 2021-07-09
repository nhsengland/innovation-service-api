import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Base } from "../Base.entity";

import { Innovation } from "../innovation/Innovation.entity";

@Entity("innovation_deployment_plan")
export class InnovationDeploymentPlan extends Base {
  //columns
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ name: "commercial_basis", nullable: true })
  commercialBasis: string;

  @Column({ name: "org_deployment_affect", nullable: true })
  orgDeploymentAffect: string;

  //relationships
  @ManyToOne(() => Innovation, { nullable: false })
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  //static constructor
  static new(data) {
    const newObj = new InnovationDeploymentPlan();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
