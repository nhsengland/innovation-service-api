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
import { User } from "./User.entity";

@Entity("comment")
export class Comment extends Base {
  //columns
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  message: string;

  //relationships
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Innovation, { nullable: false })
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  @ManyToOne(() => InnovationAction, { nullable: true })
  @JoinColumn({ name: "innovation_action_id" })
  innovationAction: InnovationAction;

  @ManyToOne(() => Comment, { nullable: true })
  @JoinColumn({ name: "reply_to_id" })
  replyTo: Comment;

  //static constructor
  static new(data) {
    const newObj = new Comment();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
