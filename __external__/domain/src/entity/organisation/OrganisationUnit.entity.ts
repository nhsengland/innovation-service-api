import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Base } from "../Base.entity";
import { Organisation } from "./Organisation.entity";

@Entity("organisation_unit")
export class OrganisationUnit extends Base {
  //columns
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  //relationships
  @ManyToOne(() => Organisation, { nullable: false })
  @JoinColumn({ name: "organisation_id" })
  organisation: Organisation;

  //static constructor
  static new(data) {
    const newObj = new OrganisationUnit();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
