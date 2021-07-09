import {
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { OrganisationUnit } from "./OrganisationUnit.entity";
import { Base } from "../Base.entity";
import { OrganisationUser } from "./OrganisationUser.entity";
import { InnovationSupport } from "../innovation/InnovationSupport.entity";

@Entity("organisation_unit_user")
@Unique("uc_org_unit_org_user_idx", ["organisationUnit", "organisationUser"])
export class OrganisationUnitUser extends Base {
  // columns
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // relationships
  @ManyToOne(() => OrganisationUnit, { nullable: false })
  @JoinColumn({ name: "organisation_unit_id" })
  organisationUnit: OrganisationUnit;

  @ManyToOne(() => OrganisationUser, { nullable: false })
  @JoinColumn({ name: "organisation_user_id" })
  organisationUser: OrganisationUser;

  @ManyToMany(() => InnovationSupport, (record) => record.organisationUnitUsers)
  innovationSupports: InnovationSupport[];

  // static constructor
  static new(data) {
    const newObj = new OrganisationUnitUser();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
