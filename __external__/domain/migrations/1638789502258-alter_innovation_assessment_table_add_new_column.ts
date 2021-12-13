import { MigrationInterface, QueryRunner } from "typeorm";

export class alterInnovationAssessmentTableAddNewColumn1638789502258
  implements MigrationInterface {
  name = "alterInnovationAssessmentTableAddNewColumn1638789502258";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation_assessment" ADD maturity_level_comment nvarchar(150) NULL;`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation_assessment" DROP COLUMN "maturity_level_comment"`
    );
  }
}
