import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import {
  AccessorOrganisationRole,
  InnovatorOrganisationRole,
  OrganisationUserRole,
} from "../../enums/organisation.enums";
import { Base } from "../Base.entity";
import { User } from "../user/User.entity";
import { Organisation } from "./Organisation.entity";
import { OrganisationUnitUser } from "./OrganisationUnitUser.entity";

let roles = Object.keys(AccessorOrganisationRole)
  .map((key) => `'${AccessorOrganisationRole[key]}'`)
  .join(",");
roles += ",";
roles += Object.keys(InnovatorOrganisationRole)
  .map((key) => `'${InnovatorOrganisationRole[key]}'`)
  .join(",");

@Entity("organisation_user")
@Unique("uc_organisation_user_idx", ["organisation", "user"])
@Check("chk_organisation_user_roles", `"role" IN (${roles})`)
export class OrganisationUser extends Base {
  // columns
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "nvarchar", length: 50 })
  role: OrganisationUserRole;

  // relationships
  @ManyToOne(() => Organisation, { nullable: false })
  @JoinColumn({ name: "organisation_id" })
  organisation: Organisation;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "user_id" })
  user: User;

  @OneToMany(() => OrganisationUnitUser, (record) => record.organisationUser)
  userOrganisationUnits: OrganisationUnitUser[];

  // static constructor
  static new(data) {
    const newObj = new OrganisationUser();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
