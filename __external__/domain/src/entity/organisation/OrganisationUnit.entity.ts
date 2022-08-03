import {
  AfterLoad,
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Base } from "../Base.entity";
import { InnovationAssessment } from "../innovation/InnovationAssessment.entity";
import { InnovationSupportLog } from "../innovation/InnovationSupportLog.entity";
import { Organisation } from "./Organisation.entity";
import { OrganisationUnitUser } from "./OrganisationUnitUser.entity";

@Entity("organisation_unit")
export class OrganisationUnit extends Base {
  //columns
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  acronym: string;

  @Column({ name: "is_shadow", nullable: false, default: false })
  isShadow: boolean;

  @Column({ name: "inactivated_at", nullable: true })
  inactivatedAt: Date;

  //relationships
  @ManyToOne(() => Organisation, { nullable: false })
  @JoinColumn({ name: "organisation_id" })
  organisation: Organisation;

  @ManyToMany(
    () => InnovationAssessment,
    (record) => record.organisationUnits,
    { lazy: true }
  )
  innovationAssessments: InnovationAssessment[];

  @ManyToMany(
    () => InnovationSupportLog,
    (record) => record.suggestedOrganisationUnits,
    { lazy: true }
  )
  innovationSupportLogs: InnovationSupportLog[];

  @OneToMany(() => OrganisationUnitUser, (record) => record.organisationUnit, {
    lazy: true,
  })
  organisationUnitUsers: OrganisationUnitUser[];

  //static constructor
  static new(data) {
    const newObj = new OrganisationUnit();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
