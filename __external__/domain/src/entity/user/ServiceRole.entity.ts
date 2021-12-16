import { User, Role } from "@domain/index";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from "typeorm";
import { Base } from "../Base.entity";

@Entity("service_role")
export class ServiceRole extends Base {
  //columns
  @PrimaryColumn({ nullable: false })
  id: string;

  @Column({ name: "active_since" })
  activeSince: Date;

  //relationships
  @OneToOne(() => Role, { nullable: false, primary: true })
  @JoinColumn({ name: "role_id" })
  role: Role;

  @ManyToOne(() => User, { nullable: false, primary: true })
  @JoinColumn({ name: "user_id" })
  user: User;

  //static constructor
  static new(data) {
    const newObj = new ServiceRole();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
