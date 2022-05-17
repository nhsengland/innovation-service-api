import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserType } from "../../enums/user.enums";

import { Base } from "../Base.entity";
import { OrganisationUser } from "../organisation/OrganisationUser.entity";
import { TermsOfUseUser } from "../tou/TermsOfUseUser.entity";
import { UserRole } from "./UserRole.entity";

@Entity("user")
export class User extends Base {
  //columns
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "simple-enum",
    enum: UserType,
    nullable: false,
  })
  type: UserType;

  @Column({
    name: "locked_at",
    nullable: true,
  })
  lockedAt: Date;

  @Column({ name: "external_id", type: "nvarchar", nullable: false })
  externalId: string;

  @Column({ name: "delete_reason", type: "nvarchar", nullable: true })
  deleteReason: string;

  //relationships
  @OneToMany(() => OrganisationUser, (record) => record.user, {
    lazy: true,
  })
  userOrganisations: OrganisationUser[];

  @OneToMany(() => UserRole, (ur) => ur.user, { cascade: ["update", "insert"] })
  serviceRoles: UserRole[];

  @OneToMany(() => TermsOfUseUser, (record) => record.user, {
    lazy: true,
    cascade: ["insert", "update"],
  })
  termsOfUseUsers?: TermsOfUseUser[];

  //static constructor
  static new(data) {
    const newObj = new User();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
