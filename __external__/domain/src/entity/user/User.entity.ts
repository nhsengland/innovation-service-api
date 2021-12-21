import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { UserType } from "../../enums/user.enums";

import { Base } from "../Base.entity";
import { OrganisationUser } from "../organisation/OrganisationUser.entity";
import { UserRole } from "./UserRole.entity";

@Entity("user")
export class User extends Base {
  //columns
  @PrimaryColumn({ nullable: false })
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

  @Column({ name: "delete_reason", type: "nvarchar", nullable: true })
  deleteReason: string;

  //relationships
  @OneToMany(() => OrganisationUser, (record) => record.user, {
    lazy: true,
  })
  userOrganisations: OrganisationUser[];

  @OneToMany(() => UserRole, (ur) => ur.user, { cascade: ["update", "insert"] })
  serviceRoles: UserRole[];

  //static constructor
  static new(data) {
    const newObj = new User();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
