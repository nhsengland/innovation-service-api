import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Base } from "../Base.entity";
import { Innovation } from "./Innovation.entity";
import { InnovationEvidence } from "./InnovationEvidence.entity";

@Entity("innovation_file")
export class InnovationFile extends Base {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "context", length: 100, nullable: true })
  context: string;

  @Column({ name: "display_file_name", length: 100 })
  displayFileName: string;

  // relationships
  @ManyToOne(() => Innovation, { nullable: false })
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  @ManyToMany(() => InnovationEvidence, (record) => record.files)
  evidence: InnovationEvidence[];

  static new(data) {
    const newObj = new InnovationFile();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
