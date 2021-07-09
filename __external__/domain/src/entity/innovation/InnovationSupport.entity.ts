import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { InnovationSupportStatus } from "../../enums/innovation.enums";
import { Base } from "../Base.entity";
import { OrganisationUnit } from "../organisation/OrganisationUnit.entity";
import { OrganisationUnitUser } from "../organisation/OrganisationUnitUser.entity";
import { Innovation } from "./Innovation.entity";
import { InnovationAction } from "./InnovationAction.entity";

@Entity("innovation_support")
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
  @JoinColumn({ name: "organisation_unit_id" })
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

  @OneToMany(() => InnovationAction, (record) => record.innovationSupport, {
    lazy: true,
  })
  actions: InnovationAction[];

  //static constructor
  static new(data) {
    const newObj = new InnovationSupport();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
