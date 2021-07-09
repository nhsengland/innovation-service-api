import { MigrationInterface, QueryRunner } from "typeorm";

export class alterInnovTable1621937806798 implements MigrationInterface {
  name = "alterInnovTable1621937806798";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Innovation Table
    await queryRunner.query(
      `ALTER TABLE "innovation" ADD "submitted_at" datetime2`
    );

    // InnovationAssessment Table
    await queryRunner.query(
      `ALTER TABLE "innovation_assessment" ADD "finished_at" datetime2`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Innovation Table
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP COLUMN "submitted_at"`
    );

    // InnovationAssessment Table
    await queryRunner.query(
      `ALTER TABLE "innovation_assessment" DROP COLUMN "finished_at"`
    );
  }
}
