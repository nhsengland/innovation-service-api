import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Base } from "../Base.entity";
import { Notification } from "./Notification.entity";
import { User } from "./User.entity";

@Entity("notification_user")
export class NotificationUser extends Base {
  //columns
  @Column({ name: "read_at", nullable: true })
  readAt: Date;

  //relationships
  @ManyToOne(() => Notification, { nullable: false, primary: true })
  @JoinColumn({ name: "notification_id" })
  notification: Notification;

  @ManyToOne(() => User, { nullable: false, primary: true })
  @JoinColumn({ name: "user_id" })
  user: User;

  //static constructor
  static new(data) {
    const newObj = new NotificationUser();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
