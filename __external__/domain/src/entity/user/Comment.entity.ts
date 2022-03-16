import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Base } from "../Base.entity";
import { Innovation } from "../innovation/Innovation.entity";
import { InnovationAction } from "../innovation/InnovationAction.entity";
import { OrganisationUnit } from "../organisation/OrganisationUnit.entity";
import { User } from "./User.entity";

@Entity("comment")
export class Comment extends Base {
  //columns
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  message: string;

  @Column({ name: "is_editable", nullable: false, default: false })
  iseditable: boolean;

  //relationships
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Innovation, { nullable: false })
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  @ManyToOne(() => Comment, { nullable: true })
  @JoinColumn({ name: "reply_to_id" })
  replyTo: Comment;

  @ManyToOne(() => InnovationAction, { nullable: true })
  @JoinColumn({ name: "innovation_action_id" })
  innovationAction: InnovationAction;

  @ManyToOne(() => OrganisationUnit, { nullable: true })
  @JoinColumn({ name: "organisation_unit_id" })
  organisationUnit: OrganisationUnit;

  //static constructor
  static new(data) {
    const newObj = new Comment();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
