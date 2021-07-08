import { GeneralBenefitCatalogue } from "@domain/enums/catalog.enums";
import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Base } from "../Base.entity";
import { Innovation } from "./Innovation.entity";

@Entity("innovation_general_benefit")
@Index(["type", "innovation"], { unique: true })
export class InnovationGeneralBenefit extends Base {
  //columns
  @PrimaryColumn({
    type: "simple-enum",
    enum: GeneralBenefitCatalogue,
    nullable: false,
  })
  type: GeneralBenefitCatalogue;

  //relationships
  @ManyToOne(() => Innovation, { nullable: false, primary: true })
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  //static constructor
  static new(data) {
    const newObj = new InnovationGeneralBenefit();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
