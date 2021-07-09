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
  ClinicalEvidenceTypeCatalogue,
  EvidenceTypeCatalogue,
} from "../../enums/catalog.enums";
import { Base } from "../Base.entity";

import { Innovation } from "../innovation/Innovation.entity";
import { InnovationFile } from "./InnovationFile.entity";

@Entity("innovation_evidence")
export class InnovationEvidence extends Base {
  //columns
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "summary", nullable: true })
  summary: string;

  @Column({ name: "evidence_type", type: "nvarchar", nullable: true })
  evidenceType: EvidenceTypeCatalogue;

  @Column({ name: "clinical_evidence_type", type: "nvarchar", nullable: true })
  clinicalEvidenceType: ClinicalEvidenceTypeCatalogue;

  @Column({ name: "description", nullable: true })
  description: string;

  //relationships
  @ManyToOne(() => Innovation, { nullable: false })
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  @ManyToMany(() => InnovationFile, (record) => record.evidence, {
    nullable: true,
  })
  @JoinTable({
    name: "innovation_evidence_file",
    joinColumn: {
      name: "innovation_evidence_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "innovation_file_id",
      referencedColumnName: "id",
    },
  })
  files: InnovationFile[];

  //static constructor
  static new(data) {
    const newObj = new InnovationEvidence();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
