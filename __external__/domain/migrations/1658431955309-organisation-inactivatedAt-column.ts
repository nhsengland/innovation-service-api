import { MigrationInterface, QueryRunner } from "typeorm";

export class organisationInactivatedAtColumn1658431955309
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organisation" ADD inactivated_at datetime2 NULL;`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organisation" DROP COLUMN "inactivated_at"`
    );
  }
}
