import { MigrationInterface, QueryRunner } from "typeorm";

export class createTableInnovationSupportType1621331271431
  implements MigrationInterface
{
  name = "createTableInnovationSupportType1621331271431";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // innovation_support_type table
    await queryRunner.query(`CREATE TABLE "innovation_support_type" (
			"created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_support_type_created_at" DEFAULT getdate(), 
			"created_by" nvarchar(255), 
			"updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_support_type_updated_at" DEFAULT getdate(), 
			"updated_by" nvarchar(255), "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_support_type_is_deleted" DEFAULT 0, 
			"type" nvarchar(255) CHECK( type IN ('ASSESSMENT','PRODUCT_MIGRATION','CLINICAL_TESTS','COMMERCIAL','PROCUREMENT', 'DEVELOPMENT','EVIDENCE_EVALUATION','FUNDING', 'INFORMATION') ) NOT NULL, 
			"innovation_id" uniqueidentifier NOT NULL, 
			[valid_from] datetime2 GENERATED ALWAYS AS ROW START,
			[valid_to] datetime2 GENERATED ALWAYS AS ROW END,
			PERIOD FOR SYSTEM_TIME (valid_from, valid_to),
			CONSTRAINT "pk_innovation_support_type_innovation_id" PRIMARY KEY ("type", "innovation_id")
		) with (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.innovation_support_type_history, History_retention_period = 7 YEAR));`);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_innovation_support_type_innovation_id" ON "innovation_support_type" ("type", "innovation_id") `
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_support_type" ADD CONSTRAINT "fk_innovation_support_type_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    // new innovation columns
    await queryRunner.query(
      `ALTER TABLE "innovation" ADD main_category nvarchar(255)`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ADD has_problem_tackle_knowledge nvarchar(255)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // innovation_support_type table
    await queryRunner.query(
      `ALTER TABLE "innovation_support_type" DROP CONSTRAINT "fk_innovation_support_type_innovation_innovation_id"`
    );

    await queryRunner.query(
      `DROP INDEX "idx_innovation_support_type_innovation_id" ON "innovation_support_type"`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_support_type" SET ( SYSTEM_VERSIONING = OFF )`
    );
    await queryRunner.query(`DROP TABLE "innovation_support_type"`);
    await queryRunner.query(`DROP TABLE "innovation_support_type_history"`);

    // new innovation columns
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP COLUMN main_category`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" DROP COLUMN has_problem_tackle_knowledge`
    );
  }
}
