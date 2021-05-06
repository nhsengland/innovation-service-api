import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { InnovationRevenueTypeCatalogue } from "../../enums/catalog.enums";
import { Base } from "../Base.entity";
import { Innovation } from "./Innovation.entity";

@Entity("innovation_revenue")
@Index(["type", "innovation"], { unique: true })
export class InnovationRevenue extends Base {
  //columns
  @PrimaryColumn({
    type: "simple-enum",
    enum: InnovationRevenueTypeCatalogue,
    nullable: false,
  })
  type: InnovationRevenueTypeCatalogue;

  //relationships
  @ManyToOne(() => Innovation, { nullable: false, primary: true })
  @JoinColumn({ name: "innovation_id" })
  innovation: Innovation;

  //static constructor
  static new(data) {
    const newObj = new InnovationRevenue();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
