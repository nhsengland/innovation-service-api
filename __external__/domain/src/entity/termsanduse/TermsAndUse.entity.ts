import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  Index,
  UpdateDateColumn,
} from "typeorm";
import { TouType } from "../../enums/terms-and-use.enums";
import { Base } from "../Base.entity";

@Entity("terms_and_use")
@Index(["name"], { unique: true })
export class TermsAndUse extends Base {
  // columns
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "name", length: 100 })
  name: string;

  @Column({
    name: "tou_type",
    type: "simple-enum",
    enum: TouType,
    nullable: false,
  })
  touType: TouType;

  @Column({ name: "summary", nullable: true, type: "nvarchar", length: 2000 })
  summary: string;

  @UpdateDateColumn({ name: "released_at", nullable: true })
  releasedAt: Date;

  // relationships

  // static constructor
  static new(data) {
    const newObj = new TermsAndUse();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
