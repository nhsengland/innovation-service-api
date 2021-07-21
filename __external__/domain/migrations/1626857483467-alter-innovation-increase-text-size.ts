/*eslint @typescript-eslint/no-unused-vars: ["off", { "varsIgnorePattern": "[qQ]ueryRunner" }]*/
import { MigrationInterface, QueryRunner } from "typeorm";

export class alterInnovationIncreaseTextSize1626857483467
  implements MigrationInterface {
  name = "alterInnovationIncreaseTextSize1626857483467";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // innovation table
    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN description nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN problems_tackled nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN problems_consequences nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN intervention nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN intervention_impact nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN market_research nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN potential_pathway nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN paying_organisations nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN benefitting_organisations nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN funding_description nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN cost_description nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN sell_expectations nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN usage_expectations nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN clinicians_impact_details nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN accessibility_impact_details nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN accessibility_steps_details nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN other_general_benefit nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN other_environmental_benefit nvarchar(max);`
    );

    // innovation_subgroup table
    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" ALTER COLUMN cost_description nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" ALTER COLUMN sell_expectations nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" ALTER COLUMN usage_expectations nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" ALTER COLUMN other_benefit nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" ALTER COLUMN other_condition nvarchar(max);`
    );

    // innovation_evidence table
    await queryRunner.query(
      `ALTER TABLE "innovation_evidence" ALTER COLUMN summary nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_evidence" ALTER COLUMN description nvarchar(max);`
    );

    // innovation_assessment table
    await queryRunner.query(
      `ALTER TABLE "innovation_assessment" ALTER COLUMN has_regulatory_approvals_comment nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_assessment" ALTER COLUMN has_evidence_comment nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_assessment" ALTER COLUMN has_validation_comment nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_assessment" ALTER COLUMN has_proposition_comment nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_assessment" ALTER COLUMN has_competition_knowledge_comment nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_assessment" ALTER COLUMN has_implementation_plan_comment nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_assessment" ALTER COLUMN has_scale_resource_comment nvarchar(max);`
    );

    // innovation_user_test table
    await queryRunner.query(
      `ALTER TABLE "innovation_user_test" ALTER COLUMN kind nvarchar(max);`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_user_test" ALTER COLUMN feedback nvarchar(max);`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // irreversible
  }
}
