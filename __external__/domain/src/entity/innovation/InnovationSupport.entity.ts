import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";

import { Base } from "../Base.entity";
import { Innovation } from "./Innovation.entity";
import { OrganisationUnit } from "../organisation/OrganisationUnit.entity";
import { OrganisationUnitUser } from "../organisation/OrganisationUnitUser.entity";
import { InnovationSupportStatus } from "../../enums/innovation.enums";

@Entity("innovation_support")
@Unique("uc_inno_support_org_unit_inno_idx", ["organisationUnit", "innovation"])
export class InnovationSupport extends Base {
  //columns
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "simple-enum",
    enum: InnovationSupportStatus,
    nullable: false,
  })
  status: InnovationSupportStatus;

  //relationships
  @ManyToOne(() => Innovation, { nullable: false })
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  @ManyToOne(() => OrganisationUnit, { nullable: false })
  @JoinColumn({ name: "organisation_user_id" })
  organisationUnit: OrganisationUnit;

  @ManyToMany(
    () => OrganisationUnitUser,
    (record) => record.innovationSupports,
    {
      nullable: true,
    }
  )
  @JoinTable({
    name: "innovation_support_user",
    joinColumn: {
      name: "innovation_support_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "organisation_unit_user_id",
      referencedColumnName: "id",
    },
  })
  organisationUnitUsers: OrganisationUnitUser[];

  //static constructor
  static new(data) {
    const newObj = new InnovationSupport();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
