import { MigrationInterface, QueryRunner } from "typeorm";

export class alterTablesSetCharacterLimit1638970584349
  implements MigrationInterface {
  name = "alterTablesSetCharacterLimit1638970584349";
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation_deployment_plan" ALTER COLUMN org_deployment_affect nvarchar(500) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_deployment_plan" ALTER COLUMN commercial_basis nvarchar(500) NULL;`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation_deployment_plan" ALTER COLUMN org_deployment_affect nvarchar(255) NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_deployment_plan" ALTER COLUMN commercial_basis nvarchar(255) NULL;`
    );
  }
}
