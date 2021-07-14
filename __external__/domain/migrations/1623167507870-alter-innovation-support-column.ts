import { MigrationInterface, QueryRunner } from "typeorm";

export class alterInnovationSupportColumn1623167507870
  implements MigrationInterface
{
  name = "alterInnovationSupportColumn1623167507870";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename Column
    await queryRunner.query(
      `ALTER TABLE "innovation_support" DROP CONSTRAINT "fk_innovation_support_organisation_unit_organisation_user_id"`
    );
    await queryRunner.query(
      `sp_rename 'innovation_support.organisation_user_id', 'organisation_unit_id', 'COLUMN';`
    );
    // ADD Constraint
    await queryRunner.query(
      `ALTER TABLE "innovation_support" ADD CONSTRAINT "fk_innovation_support_organisation_unit_id" FOREIGN KEY ("organisation_unit_id") REFERENCES "organisation_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rename Column
    await queryRunner.query(
      `ALTER TABLE "innovation_support" DROP CONSTRAINT "fk_innovation_support_organisation_unit_id"`
    );
    await queryRunner.query(
      `sp_rename 'innovation_support.organisation_unit_id', 'organisation_user_id', 'COLUMN';`
    );
    // ADD Constraint
    await queryRunner.query(
      `ALTER TABLE "innovation_support" ADD CONSTRAINT "fk_innovation_support_organisation_unit_organisation_user_id" FOREIGN KEY ("organisation_user_id") REFERENCES "organisation_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
