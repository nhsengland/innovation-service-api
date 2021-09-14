import { MigrationInterface, QueryRunner } from "typeorm";

export class alterInnovationTableNullableColumn1631615707521
  implements MigrationInterface {
  name = "alterInnovationTableNullableColumn1631615707521";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // DROP survey_id unique constraint
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP CONSTRAINT "UQ_a12c9bdde3b857e71ab2a77c0d6"`
    );

    // make survey_id nullable
    await queryRunner.query(
      `ALTER TABLE "innovation" ALTER COLUMN "survey_id" nvarchar(255) NULL;`
    );

    // add new survey_id unique constraint
    await queryRunner.query(
      `
				CREATE UNIQUE NONCLUSTERED INDEX UQ_survey_id_notnull
				ON innovation(survey_id)
				WHERE survey_id IS NOT NULL;
			`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // irreversible
  }
}
