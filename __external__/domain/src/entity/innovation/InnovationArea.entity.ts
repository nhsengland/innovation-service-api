import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { InnovationAreaCatalogue } from "../../enums/catalog.enums";
import { Base } from "../Base.entity";
import { Innovation } from "./Innovation.entity";

@Entity("innovation_area")
@Index(["type", "innovation"], { unique: true })
export class InnovationArea extends Base {
  //columns
  @PrimaryColumn({
    type: "simple-enum",
    enum: InnovationAreaCatalogue,
    nullable: false,
  })
  type: InnovationAreaCatalogue;

  //relationships
  @ManyToOne(() => Innovation, { nullable: false, primary: true })
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  //static constructor
  static new(data) {
    const newObj = new InnovationArea();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
