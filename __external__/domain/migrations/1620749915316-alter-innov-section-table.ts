import { MigrationInterface, QueryRunner } from "typeorm";

export class alterInnovSectionTable1620749915316 implements MigrationInterface {
  name = "alterInnovSectionTable1620749915316";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation_section" ADD submitted_at datetime2`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation_section" DROP COLUMN submitted_at`
    );
  }
}
