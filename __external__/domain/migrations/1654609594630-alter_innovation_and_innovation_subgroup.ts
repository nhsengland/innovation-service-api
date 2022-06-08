import { MigrationInterface, QueryRunner } from "typeorm";

export class alterInnovationAndInnovationSubgroup1654609594630
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // innovation
    await queryRunner.query(
      `ALTER TABLE "innovation" ADD other_patients_citizens_benefit nvarchar(255) NULL`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ADD care_pathway nvarchar(255) NULL`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ADD patients_range nvarchar(255) NULL`
    );

    // innovation_patients_citizens_benefit
    await queryRunner.query(
      `
            CREATE TABLE "innovation_patients_citizens_benefit" (
                "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_patients_citizens_benefit_created_at" DEFAULT getdate(), 
                "created_by" nvarchar(255), 
                "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_patients_citizens_benefit_updated_at" DEFAULT getdate(), 
                "updated_by" nvarchar(255), 
                "deleted_at" datetime2 NULL, 
                "type" nvarchar(255) NOT NULL, 
                "innovation_id" uniqueidentifier NOT NULL, 
                [valid_from] datetime2 GENERATED ALWAYS AS ROW START,
                [valid_to] datetime2 GENERATED ALWAYS AS ROW END,
                PERIOD FOR SYSTEM_TIME (valid_from, valid_to),
                CONSTRAINT "pk_innovation_patients_citizens_benefit_type_innovation_id" PRIMARY KEY ("type", "innovation_id")
                ) with (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.innovation_patients_citizens_benefit_history, History_retention_period = 7 YEAR));
            `
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_innovation_patients_citizens_benefit_type_innovation_id" ON "innovation_patients_citizens_benefit" ("type", "innovation_id")`
    );

    await queryRunner.query(
      `
            ALTER TABLE "innovation_patients_citizens_benefit" ADD CONSTRAINT "fk_innovation_patients_citizens_benefit_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // innovation
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP COLUMN other_patients_citizens_benefit`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" DROP COLUMN care_pathway`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" DROP COLUMN patients_range`
    );

    // innovation_patients_citizens_benefit
    await queryRunner.query(
      `ALTER TABLE "innovation_patients_citizens_benefit" DROP CONSTRAINT "fk_innovation_patients_citizens_benefit_innovation_innovation_id"`
    );

    await queryRunner.query(
      `DROP INDEX "idx_innovation_patients_citizens_benefit_type_innovation_id" ON "innovation_general_benefit"`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_patients_citizens_benefit" SET ( SYSTEM_VERSIONING = OFF )`
    );

    await queryRunner.query(`DROP TABLE "innovation_general_benefit"`);

    await queryRunner.query(`DROP TABLE "innovation_general_benefit_history"`);
  }
}
