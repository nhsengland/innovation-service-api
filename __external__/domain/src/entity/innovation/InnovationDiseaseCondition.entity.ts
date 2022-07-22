import { InnovationDiseaseConditionCatalogue } from "@domain/enums/catalog.enums";
import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Base } from "../Base.entity";
import { Innovation } from "./Innovation.entity";

@Entity("innovation_disease_condition")
@Index(["type", "innovation"], { unique: true })
export class InnovationDiseaseCondition extends Base {
  //columns
  @PrimaryColumn({
    type: "simple-enum",
    enum: InnovationDiseaseConditionCatalogue,
    nullable: false,
  })
  type: InnovationDiseaseConditionCatalogue;

  //relationships
  @ManyToOne(() => Innovation, { nullable: false, primary: true })
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  //static constructor
  static new(data) {
    const newObj = new InnovationDiseaseCondition();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
