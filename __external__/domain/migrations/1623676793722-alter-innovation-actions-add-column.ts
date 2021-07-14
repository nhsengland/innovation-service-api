import { MigrationInterface, QueryRunner } from "typeorm";

export class alterInnovationActionsAddColumn1623676793722
  implements MigrationInterface {
  name = "alterInnovationActionsAddColumn1623676793722";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation_action" ADD "display_id" nvarchar(5)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation_action" DROP COLUMN "display_id"`
    );
  }
}
