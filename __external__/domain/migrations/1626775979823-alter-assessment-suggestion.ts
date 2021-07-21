import { MigrationInterface, QueryRunner } from "typeorm";

export class alterAssessmentSuggestion1626775979823
  implements MigrationInterface {
  name = "alterAssessmentSuggestion1626775979823";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // innovation_assessment_organisation_unit table
    await queryRunner.query(
      `CREATE TABLE "innovation_assessment_organisation_unit" ("innovation_assessment_id" uniqueidentifier NOT NULL, "organisation_unit_id" uniqueidentifier NOT NULL, CONSTRAINT "pk_innovation_assessment_organisation_unit_innovation_assessment_id_organisation_unit_id" PRIMARY KEY ("innovation_assessment_id", "organisation_unit_id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_innovation_assessment_organisation_unit_innovation_id" ON "innovation_assessment_organisation_unit" ("innovation_assessment_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_innovation_assessment_organisation_unit_organisation_unit_id" ON "innovation_assessment_organisation_unit" ("organisation_unit_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_assessment_organisation_unit" ADD CONSTRAINT "fk_innovation_assessment_organisation_unit_innovation_assessment_id" FOREIGN KEY ("innovation_assessment_id") REFERENCES "innovation_assessment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_assessment_organisation_unit" ADD CONSTRAINT "fk_innovation_assessment_organisation_unit_organisation_unit_id" FOREIGN KEY ("organisation_unit_id") REFERENCES "organisation_unit"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    // migrate data
    await queryRunner.query(
      `insert into innovation_assessment_organisation_unit(innovation_assessment_id, organisation_unit_id)
      select iao.innovation_assessment_id, ou.id
      from innovation_assessment_organisation iao
        join organisation_unit ou on iao.organisation_id = ou.organisation_id and ou.deleted_at is null `
    );

    // drop innovation_assessment_organisation table
    await queryRunner.query(
      `ALTER TABLE "innovation_assessment_organisation" DROP CONSTRAINT "fk_innovation_assessment_organisation_innovation_assessment_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_assessment_organisation" DROP CONSTRAINT "fk_innovation_assessment_organisation_organisation_id"`
    );
    await queryRunner.query(
      `DROP INDEX "idx_innovation_assessment_organisation_innovation_id" ON "innovation_assessment_organisation"`
    );
    await queryRunner.query(
      `DROP INDEX "idx_innovation_assessment_organisation_organisation_id" ON "innovation_assessment_organisation"`
    );
    await queryRunner.query(`DROP TABLE "innovation_assessment_organisation"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // innovation_assessment_organisation table
    await queryRunner.query(
      `CREATE TABLE "innovation_assessment_organisation" ("innovation_assessment_id" uniqueidentifier NOT NULL, "organisation_id" uniqueidentifier NOT NULL, CONSTRAINT "pk_innovation_assessment_organisation_innovation_assessment_id_organisation_id" PRIMARY KEY ("innovation_assessment_id", "organisation_id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_innovation_assessment_organisation_innovation_id" ON "innovation_assessment_organisation" ("innovation_assessment_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_innovation_assessment_organisation_organisation_id" ON "innovation_assessment_organisation" ("organisation_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_assessment_organisation" ADD CONSTRAINT "fk_innovation_assessment_organisation_innovation_assessment_id" FOREIGN KEY ("innovation_assessment_id") REFERENCES "innovation_assessment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_assessment_organisation" ADD CONSTRAINT "fk_innovation_assessment_organisation_organisation_id" FOREIGN KEY ("organisation_id") REFERENCES "organisation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    // migrate data
    await queryRunner.query(
      `insert into innovation_assessment_organisation(innovation_assessment_id, organisation_id)
      select distinct iao.innovation_assessment_id, org.id
      from innovation_assessment_organisation_unit iao
        join organisation_unit ou on iao.organisation_unit_id = ou.id and ou.deleted_at is null 
        join organisation org on ou.organisation_id = org.id and org.deleted_at is null `
    );

    // drop innovation_assessment_organisation_unit table
    await queryRunner.query(
      `ALTER TABLE "innovation_assessment_organisation_unit" DROP CONSTRAINT "fk_innovation_assessment_organisation_unit_innovation_assessment_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_assessment_organisation_unit" DROP CONSTRAINT "fk_innovation_assessment_organisation_unit_organisation_unit_id"`
    );
    await queryRunner.query(
      `DROP INDEX "idx_innovation_assessment_organisation_unit_innovation_id" ON "innovation_assessment_organisation_unit"`
    );
    await queryRunner.query(
      `DROP INDEX "idx_innovation_assessment_organisation_unit_organisation_unit_id" ON "innovation_assessment_organisation_unit"`
    );
    await queryRunner.query(
      `DROP TABLE "innovation_assessment_organisation_unit"`
    );
  }
}
