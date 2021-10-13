import { NotificationContextType } from "@domain/enums/user.enums";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Base } from "../Base.entity";
import { User } from "./User.entity";

@Entity("notification_preference")
export class NotificationPreference extends Base {
  //columns
  @Column({
    type: "simple-enum",
    enum: NotificationContextType,
    nullable: false,
    primary: true,
  })
  notification_id: NotificationContextType;

  @Column({ name: "is_subscribed" })
  isSubscribed: boolean;

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
