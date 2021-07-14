import { MigrationInterface, QueryRunner } from "typeorm";

export class alterInnovRegulationTable1619768473367
  implements MigrationInterface
{
  name = "alterInnovRegulationTable1619768473367";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // DROP COLUMN innovation_evidence column
    await queryRunner.query(
      `ALTER TABLE "innovation_evidence" DROP COLUMN name`
    );

    // DROP innovation_regulation_standard TABLE
    await queryRunner.query(
      `ALTER TABLE "innovation_regulation_standard" DROP CONSTRAINT "fk_innovation_regulation_standard_innovation_innovation_id"`
    );

    await queryRunner.query(
      `DROP INDEX "idx_innovation_regulation_standard_type_innovation_id" ON "innovation_regulation_standard"`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_regulation_standard" SET ( SYSTEM_VERSIONING = OFF )`
    );
    await queryRunner.query(`DROP TABLE "innovation_regulation_standard"`);
    await queryRunner.query(
      `DROP TABLE "innovation_regulation_standard_history"`
    );

    // RECREATE innovation_standard TABLE
    await queryRunner.query(`CREATE TABLE "innovation_standard" (
            "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_standard_created_at" DEFAULT getdate(), 
            "created_by" nvarchar(255), 
            "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_standard_updated_at" DEFAULT getdate(), 
            "updated_by" nvarchar(255), 
            "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_standard_is_deleted" DEFAULT 0, 
            "id" uniqueidentifier NOT NULL CONSTRAINT "df_innovation_standard_id" DEFAULT NEWSEQUENTIALID(), 
            "type" nvarchar(255) NOT NULL, 
            "has_met" nvarchar(255) NOT NULL, 
            "innovation_id" uniqueidentifier NOT NULL, 
            [valid_from] datetime2 GENERATED ALWAYS AS ROW START,
            [valid_to] datetime2 GENERATED ALWAYS AS ROW END,
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to),
            CONSTRAINT "pk_innovation_standard_id" PRIMARY KEY ("id")
        ) with (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.innovation_standard_history, History_retention_period = 7 YEAR));`);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_innovation_standard_type_innovation_id" ON "innovation_standard" ("type", "innovation_id") `
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_standard" ADD CONSTRAINT "fk_innovation_standard_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation_evidence" ADD COLUMN name nvarchar(255)`
    );
  }
}
