import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { InnovationSupportTypeCatalogue } from "../../enums/catalog.enums";
import { Base } from "../Base.entity";
import { Innovation } from "./Innovation.entity";

@Entity("innovation_support_type")
@Index(["type", "innovation"], { unique: true })
export class InnovationSupportType extends Base {
  //columns
  @PrimaryColumn({
    type: "simple-enum",
    enum: InnovationSupportTypeCatalogue,
    nullable: false,
  })
  type: InnovationSupportTypeCatalogue;

  //relationships
  @ManyToOne(() => Innovation, { nullable: false, primary: true })
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  //static constructor
  static new(data) {
    const newObj = new InnovationSupportType();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
