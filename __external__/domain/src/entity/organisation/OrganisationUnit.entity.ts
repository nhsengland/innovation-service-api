import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Base } from "../Base.entity";
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

  //relationships
  @ManyToOne(() => Organisation, { nullable: false })
  @JoinColumn({ name: "organisation_id" })
  organisation: Organisation;

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
