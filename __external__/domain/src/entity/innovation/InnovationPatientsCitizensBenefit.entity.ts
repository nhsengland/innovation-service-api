import { PatientsCitizensBenefitCatalogue } from "@domain/enums/catalog.enums";
import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Base } from "../Base.entity";
import { Innovation } from "./Innovation.entity";

@Entity("innovation_patients_citizens_benefit")
@Index(["type", "innovation"], { unique: true })
export class InnovationPatientsCitizensBenefit extends Base {
  //columns
  @PrimaryColumn({
    type: "simple-enum",
    enum: PatientsCitizensBenefitCatalogue,
    nullable: false,
  })
  type: PatientsCitizensBenefitCatalogue;

  //relationships
  @ManyToOne(() => Innovation, { nullable: false, primary: true })
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  //static constructor
  static new(data) {
    const newObj = new InnovationPatientsCitizensBenefit();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
