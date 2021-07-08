import { SubgroupBenefitCatalogue } from "@domain/enums/catalog.enums";
import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Base } from "../Base.entity";
import { InnovationSubgroup } from "./InnovationSubgroup.entity";

@Entity("innovation_subgroup_benefit")
@Index(["type", "innovationSubgroup"], { unique: true })
export class InnovationSubgroupBenefit extends Base {
  //columns
  @PrimaryColumn({
    type: "simple-enum",
    enum: SubgroupBenefitCatalogue,
    nullable: false,
  })
  type: SubgroupBenefitCatalogue;

  //relationships
  @ManyToOne(() => InnovationSubgroup, { nullable: false, primary: true })
  @JoinColumn({ name: "innovation_subgroup_id" })
  innovationSubgroup: InnovationSubgroup;

  //static constructor
  static new(data) {
    const newObj = new InnovationSubgroupBenefit();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
