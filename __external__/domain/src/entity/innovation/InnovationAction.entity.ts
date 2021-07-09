import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { InnovationActionStatus } from "../../enums/innovation.enums";
import { Base } from "../Base.entity";
import { InnovationSection } from "./InnovationSection.entity";
import { InnovationSupport } from "./InnovationSupport.entity";

@Entity("innovation_action")
export class InnovationAction extends Base {
  //columns
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  description: string;

  @Column({ name: "display_id", length: 5 })
  displayId: string;

  @Column({
    type: "simple-enum",
    enum: InnovationActionStatus,
    nullable: false,
  })
  status: InnovationActionStatus;

  //relationships
  @ManyToOne(() => InnovationSection, { nullable: false })
  @JoinColumn({ name: "innovation_section_id" })
  innovationSection: InnovationSection;

  @ManyToOne(() => InnovationSupport, { nullable: false })
  @JoinColumn({ name: "innovation_support_id" })
  innovationSupport: InnovationSupport;

  //static constructor
  static new(data) {
    const newObj = new InnovationAction();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
