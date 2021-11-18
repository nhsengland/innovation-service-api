import { MigrationInterface, QueryRunner } from "typeorm";

export class innovationSupportUniqueConstraint1637232889869
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE NONCLUSTERED INDEX IX_UNIQUE_SUPPORT_UNIT ON innovation_support(innovation_id, organisation_unit_id, deleted_at)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation_support" DROP CONSTRAINT "IX_UNIQUE_SUPPORT_UNIT"`
    );
  }
}
