import { User, ServiceRole } from "@domain/index";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from "typeorm";
import { Base } from "../Base.entity";

@Entity("user_role")
export class UserRole extends Base {
  //columns
  @PrimaryColumn({ nullable: false })
  id: string;

  @Column({ name: "active_since" })
  activeSince: Date;

  //relationships
  @OneToOne(() => ServiceRole, { nullable: false, primary: true })
  @JoinColumn({ name: "role_id" })
  role: ServiceRole;

  @ManyToOne(() => User, { nullable: false, primary: true })
  @JoinColumn({ name: "user_id" })
  user: User;

  //static constructor
  static new(data) {
    const newObj = new UserRole();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
