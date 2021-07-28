import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { InnovationSupportLogType } from "../../enums/innovation.enums";
import { Base } from "../Base.entity";
import { OrganisationUnit } from "../organisation/OrganisationUnit.entity";
import { Innovation } from "./Innovation.entity";

@Entity("innovation_support_log")
export class InnovationSupportLog extends Base {
  //columns
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "type" })
  type: InnovationSupportLogType;

  @Column({ name: "innovation_support_status" })
  innovationSupportStatus: string;

  @Column({ name: "description" })
  description: string;

  //relationships
  @ManyToOne(() => Innovation, { nullable: false })
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  @ManyToOne(() => OrganisationUnit, { nullable: true })
  @JoinColumn({ name: "organisation_unit_id" })
  organisationUnit: OrganisationUnit;

  @ManyToMany(
    () => OrganisationUnit,
    (record) => record.innovationSupportLogs,
    {
      nullable: true,
    }
  )
  @JoinTable({
    name: "innovation_support_log_organisation_unit",
    joinColumn: {
      name: "innovation_support_log_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "organisation_unit_id",
      referencedColumnName: "id",
    },
  })
  suggestedOrganisationUnits: OrganisationUnit[];

  //static constructor
  static new(data) {
    const newObj = new InnovationSupportLog();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
