import { MigrationInterface, QueryRunner } from "typeorm";

export class alterInnovationActionsColumn1623396895691
  implements MigrationInterface {
  name = "alterInnovationActionsColumn1623396895691";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove AssignTo Column
    await queryRunner.query(
      `ALTER TABLE "innovation_action" DROP CONSTRAINT "fk_innovation_action_user_assign_to_id"`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_action" DROP COLUMN "assign_to_id"`
    );

    // Rename Column: Message to Description
    await queryRunner.query(
      `sp_rename 'innovation_action.message', 'description', 'COLUMN';`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add AssignTo Column
    await queryRunner.query(
      `ALTER TABLE "innovation_action" ADD "assign_to_id" nvarchar(255)`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_action" ADD CONSTRAINT "fk_innovation_action_user_assign_to_id" FOREIGN KEY ("assign_to_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    // Rename Column: Message to Description
    await queryRunner.query(
      `sp_rename 'innovation_action.description', 'message', 'COLUMN';`
    );
  }
}
