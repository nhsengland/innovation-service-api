import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { InnovationTransferStatus } from "../../enums/innovation.enums";
import { Base } from "../Base.entity";
import { Innovation } from "./Innovation.entity";

@Entity("innovation_transfer")
export class InnovationTransfer extends Base {
  //columns
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "simple-enum",
    enum: InnovationTransferStatus,
    nullable: false,
  })
  status: InnovationTransferStatus;

  @Column({ name: "email", type: "nvarchar", nullable: false })
  email: string;

  @Column({ name: "email_count", nullable: false })
  emailCount: number;

  //relationships
  @ManyToOne(() => Innovation, { nullable: false })
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  @Column({ name: "finished_at", nullable: true })
  finishedAt: Date;

  //static constructor
  static new(data) {
    const newObj = new InnovationTransfer();
    newObj.status = InnovationTransferStatus.PENDING;

    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
