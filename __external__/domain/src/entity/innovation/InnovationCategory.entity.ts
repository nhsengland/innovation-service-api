import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { InnovationCategoryCatalogue } from "../../enums/catalog.enums";
import { Base } from "../Base.entity";
import { Innovation } from "./Innovation.entity";

@Entity("innovation_category")
@Index(["type", "innovation"], { unique: true })
export class InnovationCategory extends Base {
  //columns
  @PrimaryColumn({
    type: "simple-enum",
    enum: InnovationCategoryCatalogue,
    nullable: false,
  })
  type: InnovationCategoryCatalogue;

  //relationships
  @ManyToOne(() => Innovation, { nullable: false, primary: true })
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  //static constructor
  static new(data) {
    const newObj = new InnovationCategory();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
