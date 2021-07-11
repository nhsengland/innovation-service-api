import { NotificationContextType } from "@domain/enums/user.enums";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Base } from "../Base.entity";
import { Innovation } from "../innovation/Innovation.entity";
import { NotificationUser } from "./NotificationUser.entity";

@Entity("notification")
export class Notification extends Base {
  //columns
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "message" })
  message: string;

  @Column({ name: "context_type" })
  contextType: NotificationContextType;

  @Column({ name: "context_id" })
  contextId: string;

  @Column({ name: "activity_type" })
  activityType: string;

  //relationships
  @ManyToOne(() => Innovation)
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  @OneToMany(
    () => NotificationUser,
    (notificationUser) => notificationUser.notification,
    {
      lazy: true,
      cascade: ["insert", "update"],
    }
  )
  notificationUsers: NotificationUser[];

  //static constructor
  static new(data) {
    const newObj = new Notification();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
