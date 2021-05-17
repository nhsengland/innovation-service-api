import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
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
import { InnovationFile } from "./InnovationFile.entity";

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

  @ManyToMany(() => InnovationFile, (record) => record.evidence, {
    nullable: true,
  })
  @JoinTable({
    name: "innovation_section_file",
    joinColumn: {
      name: "innovation_section_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "innovation_file_id",
      referencedColumnName: "id",
    },
  })
  files: InnovationFile[];

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
