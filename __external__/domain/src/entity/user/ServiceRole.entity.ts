import { Column, Entity, PrimaryColumn } from "typeorm";
import { Base } from "../Base.entity";

@Entity("service_role")
export class ServiceRole extends Base {
  //columns
  @PrimaryColumn({ nullable: false })
  id: string;

  @Column({ name: "name", type: "nvarchar", length: 100, nullable: false })
  name: string;

  //static constructor
  static new(data) {
    const newObj = new ServiceRole();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
