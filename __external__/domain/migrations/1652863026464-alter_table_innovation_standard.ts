import { MigrationInterface, QueryRunner } from "typeorm";

export class alterTableInnovationStandard1652863026464
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE innovation_standard ALTER COLUMN has_met  nvarchar(255) NULL;`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE innovation_standard ALTER COLUMN has_met  nvarchar(255) NOT NULL;`
    );
  }
}
