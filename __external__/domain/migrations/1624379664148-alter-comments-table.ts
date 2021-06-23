import { MigrationInterface, QueryRunner } from "typeorm";

export class alterCommentsTable1624379664148 implements MigrationInterface {
  name = "alterCommentsTable1624379664148";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "comment" ALTER COLUMN message nvarchar(max) NOT NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "comment" ADD organisation_unit_id uniqueidentifier NULL;`
    );

    await queryRunner.query(
      `ALTER TABLE "comment" ADD CONSTRAINT "fk_comment_organisation_unit_id" FOREIGN KEY ("organisation_unit_id") REFERENCES "organisation_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    // innovation_support table
    await queryRunner.query(
      `ALTER TABLE "innovation_support" DROP CONSTRAINT "uc_inno_support_org_unit_inno_idx"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP CONSTRAINT "fk_comment_organisation_unit_id"`
    );

    await queryRunner.query(
      `ALTER TABLE "comment" DROP COLUMN "organisation_unit_id"`
    );
  }
}
