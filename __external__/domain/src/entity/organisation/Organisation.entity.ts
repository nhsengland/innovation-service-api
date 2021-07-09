import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrganisationType } from "../../enums/organisation.enums";
import { Base } from "../Base.entity";
import { Innovation } from "../innovation/Innovation.entity";
import { InnovationAssessment } from "../innovation/InnovationAssessment.entity";

@Entity("organisation")
export class Organisation extends Base {
  // columns
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({
    type: "simple-enum",
    enum: OrganisationType,
    nullable: false,
  })
  type: OrganisationType;

  @Column({ nullable: true })
  acronym: string;

  @Column({ nullable: true })
  size: string;

  @Column({ name: "is_shadow", nullable: false, default: false })
  isShadow: boolean;

  // relationships
  @ManyToMany(() => Innovation, (record) => record.organisationShares)
  innovationShares: Innovation[];

  @ManyToMany(() => InnovationAssessment, (record) => record.organisations)
  innovationAssessments: InnovationAssessment[];

  // static constructor
  static new(data) {
    const newObj = new Organisation();
    Object.keys(data).forEach((key) => {
      newObj[key] = data[key];
    });

    return newObj;
  }
}
