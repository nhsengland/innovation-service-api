import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import {
  InnovationSectionCatalogue,
  InnovationSectionStatus,
} from "../../enums/innovation.enums";
import { Base } from "../Base.entity";
import { Innovation } from "./Innovation.entity";
import { InnovationAction } from "./InnovationAction.entity";

@Entity("innovation_section")
@Index(["section", "innovation"], { unique: true })
export class InnovationSection extends Base {
  // columns
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "simple-enum",
    enum: InnovationSectionCatalogue,
    nullable: false,
  })
  section: InnovationSectionCatalogue;

  @Column({
    type: "simple-enum",
    enum: InnovationSectionStatus,
    nullable: false,
  })
  status: InnovationSectionStatus;

  @Column({ name: "submitted_at", nullable: true })
  submittedAt: Date;

  // relationships
  @ManyToOne(() => Innovation, { nullable: false })
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  @OneToMany(() => InnovationAction, (record) => record.innovationSection, {
    lazy: true,
  })
  actions: InnovationAction[];

  // static constructor
  static new(data) {
    const newObj = new InnovationSection();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
