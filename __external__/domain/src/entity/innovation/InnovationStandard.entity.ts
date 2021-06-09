import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import {
  InnovationStandardCatologue,
  StandardMetCatalogue,
} from "../../enums/catalog.enums";
import { Base } from "../Base.entity";

import { Innovation } from "../innovation/Innovation.entity";

@Entity("innovation_standard")
@Index(["type", "innovation"], { unique: true })
export class InnovationStandard extends Base {
  //columns
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "type", type: "nvarchar" })
  type: InnovationStandardCatologue;

  @Column({ name: "has_met", type: "nvarchar" })
  hasMet: StandardMetCatalogue;

  //relationships
  @ManyToOne(() => Innovation, { nullable: false })
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  //static constructor
  static new(data) {
    const newObj = new InnovationStandard();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
