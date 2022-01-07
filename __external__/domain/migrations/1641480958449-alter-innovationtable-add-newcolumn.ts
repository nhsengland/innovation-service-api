import { MigrationInterface, QueryRunner } from "typeorm";

export class alterInnovationtableAddNewcolumn1641480958449
  implements MigrationInterface {
  name = "alterInnovationtableAddNewcolumn1641480958449";
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation" ADD moreSupportDescription nvarchar(500) NULL;`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP COLUMN "moreSupportDescription"`
    );
  }
}
