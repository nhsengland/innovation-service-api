import { MigrationInterface, QueryRunner } from "typeorm";

export class createTableInnovationDiseaseCondition1658321166161
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "innovation_disease_condition" (
      "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_disease_condition_created_at" DEFAULT getdate(), 
      "created_by" nvarchar(255), 
      "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_disease_condition_updated_at" DEFAULT getdate(), 
      "updated_by" nvarchar(255), 
      "deleted_at" datetime2 NULL,
      "type" nvarchar(255) NOT NULL, 
      "innovation_id" uniqueidentifier NOT NULL, 
      [valid_from] datetime2 GENERATED ALWAYS AS ROW START,
      [valid_to] datetime2 GENERATED ALWAYS AS ROW END,
      PERIOD FOR SYSTEM_TIME (valid_from, valid_to),
      CONSTRAINT "pk_innovation_disease_condition_type_innovation_id" PRIMARY KEY ("type", "innovation_id")
    ) with (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.innovation_disease_condition_history, History_retention_period = 7 YEAR));`);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_innovation_disease_condition_type_innovation_id" ON "innovation_disease_condition" ("type", "innovation_id") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "idx_innovation_disease_condition_type_innovation_id" ON "innovation_disease_condition"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_disease_condition" SET ( SYSTEM_VERSIONING = OFF )`
    );
    await queryRunner.query(`DROP TABLE "innovation_disease_condition"`);
    await queryRunner.query(
      `DROP TABLE "innovation_disease_condition_history"`
    );
  }
}
