import { MigrationInterface, QueryRunner } from "typeorm";

export class alterInnovationRecordV31625572027787
  implements MigrationInterface
{
  name = "alterInnovationRecordV31625572027787";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // innovation table
    await queryRunner.query(`ALTER TABLE "innovation" DROP COLUMN "benefits"`);

    await queryRunner.query(
      `ALTER TABLE "innovation" DROP COLUMN "has_subgroups"`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ADD cost_description nvarchar(255) NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" ADD sell_expectations nvarchar(255) NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" ADD usage_expectations nvarchar(255) NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" ADD cost_comparison nvarchar(255) NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" ADD clinicians_impact_details nvarchar(255) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ADD accessibility_impact_details nvarchar(255) NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" ADD accessibility_steps_details nvarchar(255) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ADD other_general_benefit nvarchar(255) NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" ADD other_environmental_benefit nvarchar(255) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ADD impact_patients bit NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" ADD impact_clinicians bit NULL;`
    );

    // innovation_general_benefit table
    await queryRunner.query(`CREATE TABLE "innovation_general_benefit" (
      "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_general_benefit_created_at" DEFAULT getdate(), 
      "created_by" nvarchar(255), 
      "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_general_benefit_updated_at" DEFAULT getdate(), 
      "updated_by" nvarchar(255), 
      "deleted_at" datetime2 NULL, 
      "type" nvarchar(255) NOT NULL, 
      "innovation_id" uniqueidentifier NOT NULL, 
      [valid_from] datetime2 GENERATED ALWAYS AS ROW START,
      [valid_to] datetime2 GENERATED ALWAYS AS ROW END,
      PERIOD FOR SYSTEM_TIME (valid_from, valid_to),
      CONSTRAINT "pk_innovation_general_benefit_type_innovation_id" PRIMARY KEY ("type", "innovation_id")
      ) with (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.innovation_general_benefit_history, History_retention_period = 7 YEAR));`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_innovation_general_benefit_type_innovation_id" ON "innovation_general_benefit" ("type", "innovation_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_general_benefit" ADD CONSTRAINT "fk_innovation_general_benefit_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    // innovation_environmental_benefit table
    await queryRunner.query(`CREATE TABLE "innovation_environmental_benefit" (
      "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_environmental_benefit_created_at" DEFAULT getdate(), 
      "created_by" nvarchar(255), 
      "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_environmental_benefit_updated_at" DEFAULT getdate(), 
      "updated_by" nvarchar(255), 
      "deleted_at" datetime2 NULL, 
      "type" nvarchar(255) NOT NULL, 
      "innovation_id" uniqueidentifier NOT NULL, 
      [valid_from] datetime2 GENERATED ALWAYS AS ROW START,
      [valid_to] datetime2 GENERATED ALWAYS AS ROW END,
      PERIOD FOR SYSTEM_TIME (valid_from, valid_to),
      CONSTRAINT "pk_innovation_environmental_benefit_type_innovation_id" PRIMARY KEY ("type", "innovation_id")
      ) with (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.innovation_environmental_benefit_history, History_retention_period = 7 YEAR));`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_innovation_environmental_benefit_type_innovation_id" ON "innovation_environmental_benefit" ("type", "innovation_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_environmental_benefit" ADD CONSTRAINT "fk_innovation_environmental_benefit_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    // innovation_subgroup table
    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" DROP COLUMN "benefits"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" ADD other_benefit nvarchar(255) NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" ADD other_condition nvarchar(255) NULL;`
    );

    // innovation_subgroup_benefit table
    await queryRunner.query(`CREATE TABLE "innovation_subgroup_benefit" (
      "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_subgroup_benefit_created_at" DEFAULT getdate(), 
      "created_by" nvarchar(255), 
      "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_subgroup_benefit_updated_at" DEFAULT getdate(), 
      "updated_by" nvarchar(255), 
      "deleted_at" datetime2 NULL, 
      "type" nvarchar(255) NOT NULL, 
      "innovation_subgroup_id" uniqueidentifier NOT NULL, 
      [valid_from] datetime2 GENERATED ALWAYS AS ROW START,
      [valid_to] datetime2 GENERATED ALWAYS AS ROW END,
      PERIOD FOR SYSTEM_TIME (valid_from, valid_to),
      CONSTRAINT "pk_innovation_subgroup_benefit_type_innovation_subgroup_id" PRIMARY KEY ("type", "innovation_subgroup_id")
      ) with (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.innovation_subgroup_benefit_history, History_retention_period = 7 YEAR));`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_innovation_subgroup_benefit_type_innovation_subgroup_id" ON "innovation_subgroup_benefit" ("type", "innovation_subgroup_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup_benefit" ADD CONSTRAINT "fk_innovation_subgroup_benefit_innovation_subgroup_id" FOREIGN KEY ("innovation_subgroup_id") REFERENCES "innovation_subgroup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // innovation table
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP COLUMN "cost_description"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP COLUMN "sell_expectations"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP COLUMN "usage_expectations"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP COLUMN "cost_comparison"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP COLUMN "clinicians_impact_details"`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" DROP COLUMN "accessibility_impact_details"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP COLUMN "accessibility_steps_details"`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" DROP COLUMN "other_general_benefit"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP COLUMN "other_environmental_benefit"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP COLUMN "impact_patients"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP COLUMN "impact_clinicians"`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ADD benefits nvarchar(255) NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" ADD has_subgroups nvarchar(255) NULL;`
    );

    // innovation_general_benefit
    await queryRunner.query(
      `ALTER TABLE "innovation_general_benefit" DROP CONSTRAINT "fk_innovation_general_benefit_innovation_innovation_id"`
    );
    await queryRunner.query(
      `DROP INDEX "idx_innovation_general_benefit_type_innovation_id" ON "innovation_general_benefit"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_general_benefit" SET ( SYSTEM_VERSIONING = OFF )`
    );
    await queryRunner.query(`DROP TABLE "innovation_general_benefit"`);
    await queryRunner.query(`DROP TABLE "innovation_general_benefit_history"`);

    // innovation_environmental_benefit
    await queryRunner.query(
      `ALTER TABLE "innovation_environmental_benefit" DROP CONSTRAINT "fk_innovation_environmental_benefit_innovation_innovation_id"`
    );
    await queryRunner.query(
      `DROP INDEX "idx_innovation_environmental_benefit_type_innovation_id" ON "innovation_environmental_benefit"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_environmental_benefit" SET ( SYSTEM_VERSIONING = OFF )`
    );
    await queryRunner.query(`DROP TABLE "innovation_environmental_benefit"`);
    await queryRunner.query(
      `DROP TABLE "innovation_environmental_benefit_history"`
    );

    // innovation_subgroup table
    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" DROP COLUMN "other_benefit"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" DROP COLUMN "other_condition"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" ADD benefits nvarchar(255) NULL;`
    );

    // innovation_subgroup_benefit table
    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup_benefit" DROP CONSTRAINT "fk_innovation_subgroup_benefit_innovation_subgroup_id"`
    );
    await queryRunner.query(
      `DROP INDEX "idx_innovation_subgroup_benefit_type_innovation_subgroup_id" ON "innovation_subgroup_benefit"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup_benefit" SET ( SYSTEM_VERSIONING = OFF )`
    );
    await queryRunner.query(`DROP TABLE "innovation_subgroup_benefit"`);
    await queryRunner.query(`DROP TABLE "innovation_subgroup_benefit_history"`);
  }
}
