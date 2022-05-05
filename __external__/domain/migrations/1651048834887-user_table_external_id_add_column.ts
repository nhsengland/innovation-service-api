import { MigrationInterface, QueryRunner } from "typeorm";

export class userTableExternalIdAddColumn1651048834887
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      ALTER TABLE "user" ADD external_id nvarchar(255)  NULL
      `
    );

    await queryRunner.query(
      `
      update [user] set external_id = id

      ALTER TABLE "user" ALTER COLUMN external_id nvarchar(255) NOT NULL

      CREATE UNIQUE INDEX "idx_user_unique_external_id" on "user" ("external_id")

      `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "idx_user_unique_external_id" on "user"`
    );

    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN external_id`);
  }
}
