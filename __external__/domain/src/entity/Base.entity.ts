import { Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export class Base {
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Column({ name: "created_by", nullable: true })
  createdBy: string;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ name: "updated_by", nullable: true })
  updatedBy: string;

  @Column({ name: "is_deleted", nullable: false, default: false })
  isDeleted: boolean;
}
