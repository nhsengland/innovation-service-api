import { MigrationInterface, QueryRunner } from "typeorm";

export class userAddSurveyIdFirstTimeSignInAt1651773405664
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        ALTER TABLE "user" ADD first_time_sign_in_at datetime2  NULL
      `
    );
    await queryRunner.query(
      `
        update [user] set first_time_sign_in_at = created_at
      `
    );

    await queryRunner.query(
      `
        ALTER TABLE "user" ADD survey_id nvarchar(255) NULL
      `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN first_time_sign_in_at`
    );

    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN survey_id`);
  }
}
