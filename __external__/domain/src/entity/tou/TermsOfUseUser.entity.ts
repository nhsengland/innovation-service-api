import { User } from "../user/User.entity";
import {
  Entity,
  ManyToOne,
  JoinColumn,
  Unique,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Base } from "../Base.entity";
import { TermsOfUse } from "./TermsOfUse.entity";

@Entity("terms_of_use_user")
@Unique("uc_termsOfUse_user_idx", ["termsOfUse", "user"])
export class TermsOfUseUser extends Base {
  // relationships
  @ManyToOne(() => TermsOfUse, { nullable: false })
  @JoinColumn({ name: "tou_id" })
  termsOfUse: TermsOfUse;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "user_id" })
  user: User;

  // columns
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @UpdateDateColumn({ name: "accepted_at", nullable: false })
  acceptedAt: Date;

  // static constructor
  static new(data) {
    const newObj = new TermsOfUseUser();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
