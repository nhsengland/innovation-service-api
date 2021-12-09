import { MigrationInterface, QueryRunner } from "typeorm";

export class alterTablesSetCharacterLimit1638970584349
  implements MigrationInterface {
  name = "alterTablesSetCharacterLimit1638970584349";
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation_support_log" ALTER COLUMN description nvarchar(2000) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN delete_reason nvarchar(2000) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN archive_reason nvarchar(2000) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_action" ALTER COLUMN description nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "comment" ALTER COLUMN message nvarchar(2000) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN description nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_assessment" ALTER COLUMN summary nvarchar(2000) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_assessment" ALTER COLUMN description nvarchar(2000) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN description nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN problems_tackled nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN problems_consequences nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN intervention_impact nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN intervention nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN clinicians_impact_details nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN accessibility_impact_details nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN accessibility_steps_details nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN market_research nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN potential_pathway nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_user_test" ALTER COLUMN feedback nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN cost_description nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN sell_expectations nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN usage_expectations nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" ALTER COLUMN cost_description nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" ALTER COLUMN sell_expectations nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" ALTER COLUMN usage_expectations nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN paying_organisations nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN benefitting_organisations nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN funding_description nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_deployment_plan" ALTER COLUMN org_deployment_affect nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_deployment_plan" ALTER COLUMN commercial_basis nvarchar(500) NULL;`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation_support_log" ALTER COLUMN description nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN delete_reason nvarchar(50) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN archive_reason nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_action" ALTER COLUMN description nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "comment" ALTER COLUMN message nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN description nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_assessment" ALTER COLUMN summary nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_assessment" ALTER COLUMN description nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN description nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN problems_tackled nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN problems_consequences nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN intervention_impact nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN intervention nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN clinicians_impact_details nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN accessibility_impact_details nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN accessibility_steps_details nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN market_research nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN potential_pathway nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_user_test" ALTER COLUMN feedback nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN cost_description nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN sell_expectations nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN usage_expectations nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" ALTER COLUMN cost_description nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" ALTER COLUMN sell_expectations nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" ALTER COLUMN usage_expectations nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN payingOrganisations nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN benefitting_organisations nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN funding_description nvarchar(max) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_deployment_plan" ALTER COLUMN org_deployment_affect nvarchar(255) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_deployment_plan" ALTER COLUMN commercial_basis nvarchar(255) NULL;`
    );
  }
}
