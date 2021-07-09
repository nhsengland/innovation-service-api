import { EnvironmentalBenefitCatalogue } from "@domain/enums/catalog.enums";
import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Base } from "../Base.entity";
import { Innovation } from "./Innovation.entity";

@Entity("innovation_environmental_benefit")
@Index(["type", "innovation"], { unique: true })
export class InnovationEnvironmentalBenefit extends Base {
  //columns
  @PrimaryColumn({
    type: "simple-enum",
    enum: EnvironmentalBenefitCatalogue,
    nullable: false,
  })
  type: EnvironmentalBenefitCatalogue;

  //relationships
  @ManyToOne(() => Innovation, { nullable: false, primary: true })
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  //static constructor
  static new(data) {
    const newObj = new InnovationEnvironmentalBenefit();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
