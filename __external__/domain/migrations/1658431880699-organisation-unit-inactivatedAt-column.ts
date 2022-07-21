import { MigrationInterface, QueryRunner } from "typeorm";

export class organisationUnitInactivatedAtColumn1658431880699
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organisation_unit" ADD inactivated_at datetime2 NULL;`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organisation_unit" DROP COLUMN "inactivated_at"`
    );
  }
}
