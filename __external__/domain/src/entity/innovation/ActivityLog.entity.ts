import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
  } from "typeorm";
  import { Activity, ActivityType } from "../../enums/activity.enums";
  import { Base } from "../Base.entity";
  import { OrganisationUnit } from "../organisation/OrganisationUnit.entity";
  import { Innovation } from "./Innovation.entity";
  
  @Entity("activity_log")
  export class ActivityLog extends Base {
    //columns
    @PrimaryGeneratedColumn("uuid")
    id: string;
  
    @Column({ name: "type" })
    type: ActivityType;
  
    @Column({ name: "activity" })
    activity: Activity;
  
    @Column({ name: "param" })
    param: string;
  
    //relationships
    @ManyToOne(() => Innovation, { nullable: false })
    @JoinColumn({ name: "innovation_id" })
    innovation: Innovation;
  
    //static constructor
    static new(data) {
      const newObj = new ActivityLog();
      Object.keys(data).forEach((key) => {
        newObj[key] = data[key];
      });
  
      return newObj;
    }
  }
  