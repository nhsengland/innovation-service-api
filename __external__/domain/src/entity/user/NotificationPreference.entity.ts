import {
  NotificationContextType,
  NotificationPreferenceType,
} from "@domain/enums/user.enums";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Base } from "../Base.entity";
import { User } from "./User.entity";

@Entity("notification_preference")
export class NotificationPreference extends Base {
  //columns
  @Column({
    type: "simple-enum",
    enum: NotificationContextType,
    name: "notification_id",
    nullable: false,
    primary: true,
  })
  notificationId: NotificationContextType;

  @Column({
    type: "simple-enum",
    enum: NotificationContextType,
    nullable: false,
  })
  preference: NotificationPreferenceType;

  //relationships
  @ManyToOne(() => User, { nullable: false, primary: true })
  @JoinColumn({ name: "user_id" })
  user: User;

  //static constructor
  static new(data) {
    const newObj = new NotificationPreference();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
