import { MigrationInterface, QueryRunner } from "typeorm";

export class alterAssessmentTableCommentsLength1648631766698
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
                  ALTER TABLE "innovation_assessment" ALTER COLUMN maturity_level_comment nvarchar(200);
                  ALTER TABLE "innovation_assessment" ALTER COLUMN has_regulatory_approvals_comment nvarchar(200);
                  ALTER TABLE "innovation_assessment" ALTER COLUMN has_evidence_comment nvarchar(200);
                  ALTER TABLE "innovation_assessment" ALTER COLUMN has_validation_comment nvarchar(200);
                  ALTER TABLE "innovation_assessment" ALTER COLUMN has_proposition_comment nvarchar(200);
                  ALTER TABLE "innovation_assessment" ALTER COLUMN has_competition_knowledge_comment nvarchar(200);
                  ALTER TABLE "innovation_assessment" ALTER COLUMN has_implementation_plan_comment nvarchar(200);
                  ALTER TABLE "innovation_assessment" ALTER COLUMN has_scale_resource_comment nvarchar(500);
                  `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
              ALTER TABLE "innovation_assessment" ALTER COLUMN maturity_level_comment nvarchar(150);
              ALTER TABLE "innovation_assessment" ALTER COLUMN has_regulatory_approvals_comment nvarchar(max);
              ALTER TABLE "innovation_assessment" ALTER COLUMN has_evidence_comment nvarchar(max);
              ALTER TABLE "innovation_assessment" ALTER COLUMN has_validation_comment nvarchar(max);
              ALTER TABLE "innovation_assessment" ALTER COLUMN has_proposition_comment nvarchar(max);
              ALTER TABLE "innovation_assessment" ALTER COLUMN has_competition_knowledge_comment nvarchar(max);
              ALTER TABLE "innovation_assessment" ALTER COLUMN has_implementation_plan_comment nvarchar(max);
              ALTER TABLE "innovation_assessment" ALTER COLUMN has_scale_resource_comment nvarchar(max);
              `
    );
  }
}
