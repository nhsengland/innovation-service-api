import { MigrationInterface, QueryRunner } from "typeorm";

export class userLockedAtColumn1636968339516 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD locked_at datetime2`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN locked_at`);
  }
}
