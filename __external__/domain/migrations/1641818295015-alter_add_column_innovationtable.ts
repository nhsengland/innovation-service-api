import { MigrationInterface, QueryRunner } from "typeorm";

export class alterAddColumnInnovationtable1641818295015
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation" ADD more_support_description nvarchar(500) NULL;`
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP COLUMN "more_support_description"`
    );
  }
}
