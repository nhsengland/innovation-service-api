import { Column, Entity, PrimaryColumn } from "typeorm";
import { UserType } from "../../enums/user.enums";

import { Base } from "../Base.entity";

@Entity("user")
export class User extends Base {
  //columns
  @PrimaryColumn({ nullable: false })
  id: string;

  @Column({
    type: "simple-enum",
    enum: UserType,
    nullable: false,
  })
  type: UserType;

  //relationships

  //static constructor
  static new(data) {
    const newObj = new User();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
