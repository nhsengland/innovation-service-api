import { MigrationInterface, QueryRunner } from "typeorm";

export class alterInnovTable1621267606478 implements MigrationInterface {
  name = "alterInnovTable1621267606478";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation" ADD other_revenue_description  nvarchar(255)`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ADD problems_tackled  nvarchar(255)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation_section" DROP COLUMN other_revenue_description`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_section" DROP COLUMN problems_tackled`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation" ADD problems_trackled  nvarchar(255)`
    );
  }
}
