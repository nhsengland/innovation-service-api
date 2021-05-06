import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { InnovationCareSettingCatalogue } from "../../enums/catalog.enums";
import { Base } from "../Base.entity";
import { Innovation } from "./Innovation.entity";

@Entity("innovation_care_setting")
@Index(["type", "innovation"], { unique: true })
export class InnovationCareSetting extends Base {
  //columns
  @PrimaryColumn({
    type: "simple-enum",
    enum: InnovationCareSettingCatalogue,
    nullable: false,
  })
  type: InnovationCareSettingCatalogue;

  //relationships
  @ManyToOne(() => Innovation, { nullable: false, primary: true })
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  //static constructor
  static new(data) {
    const newObj = new InnovationCareSetting();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
