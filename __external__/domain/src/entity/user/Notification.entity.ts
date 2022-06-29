import {
  NotifContextDetail,
  NotifContextType,
} from "@domain/enums/notification.enums";
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

  @Column({ name: "context_type" })
  contextType: NotifContextType;

  @Column({ name: "context_id" })
  contextId: string;

  @Column({ name: "context_detail" })
  contextDetail: NotifContextDetail;

  @Column({ name: "params" })
  params: string;

  //relationships
  @ManyToOne(() => Innovation)
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  @OneToMany(
    () => NotificationUser,
    (notificationUser) => notificationUser.notification,
    {
      lazy: false,
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
