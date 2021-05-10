import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { InnovationClinicalAreaCatalogue } from "../../enums/catalog.enums";
import { Base } from "../Base.entity";
import { Innovation } from "./Innovation.entity";

@Entity("innovation_clinical_area")
@Index(["type", "innovation"], { unique: true })
export class InnovationClinicalArea extends Base {
  //columns
  @PrimaryColumn({
    type: "simple-enum",
    enum: InnovationClinicalAreaCatalogue,
    nullable: false,
  })
  type: InnovationClinicalAreaCatalogue;

  //relationships
  @ManyToOne(() => Innovation, { nullable: false, primary: true })
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  //static constructor
  static new(data) {
    const newObj = new InnovationClinicalArea();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
