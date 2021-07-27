import { MigrationInterface, QueryRunner } from "typeorm";

export class createInnovationSupportLog1627284274397
  implements MigrationInterface {
  name = "createInnovationSupportLog1627284274397";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // innovation_support_log table
    await queryRunner.query(`CREATE TABLE "innovation_support_log" (
      "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_support_log_created_at" DEFAULT getdate(), 
      "created_by" nvarchar(255), 
      "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_support_log_updated_at" DEFAULT getdate(), 
      "updated_by" nvarchar(255), 
      "deleted_at" datetime2, 
      "id" uniqueidentifier NOT NULL CONSTRAINT "df_innovation_support_log_id" DEFAULT NEWSEQUENTIALID(), 
      "description" nvarchar(max) NULL, 
      "type" nvarchar(50),
      "innovation_support_status" nvarchar(255) NULL,
      "innovation_id" uniqueidentifier NOT NULL,
      "organisation_unit_id" uniqueidentifier NULL,
      CONSTRAINT "pk_innovation_support_log_id" PRIMARY KEY ("id")
		);`);

    await queryRunner.query(
      `ALTER TABLE "innovation_support_log" ADD CONSTRAINT "fk_innovation_support_log_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_support_log" ADD CONSTRAINT "fk_innovation_support_log_organisation_unit_id" FOREIGN KEY ("organisation_unit_id") REFERENCES "organisation_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    // innovation_support_log_organisation_unit table
    await queryRunner.query(
      `CREATE TABLE "innovation_support_log_organisation_unit" ("innovation_support_log_id" uniqueidentifier NOT NULL, "organisation_unit_id" uniqueidentifier NOT NULL, CONSTRAINT "pk_innovation_support_log_organisation_unit_innovation_support_log_id_organisation_unit_id" PRIMARY KEY ("innovation_support_log_id", "organisation_unit_id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_innovation_support_log_organisation_unit_innovation_id" ON "innovation_support_log_organisation_unit" ("innovation_support_log_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_innovation_support_log_organisation_unit_organisation_unit_id" ON "innovation_support_log_organisation_unit" ("organisation_unit_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_support_log_organisation_unit" ADD CONSTRAINT "fk_innovation_support_log_organisation_unit_innovation_support_log_id" FOREIGN KEY ("innovation_support_log_id") REFERENCES "innovation_support_log"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_support_log_organisation_unit" ADD CONSTRAINT "fk_innovation_support_log_organisation_unit_organisation_unit_id" FOREIGN KEY ("organisation_unit_id") REFERENCES "organisation_unit"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // drop innovation_support_log_organisation_unit table
    await queryRunner.query(
      `ALTER TABLE "innovation_support_log_organisation_unit" DROP CONSTRAINT "fk_innovation_support_log_organisation_unit_innovation_support_log_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_support_log_organisation_unit" DROP CONSTRAINT "fk_innovation_support_log_organisation_unit_organisation_unit_id"`
    );
    await queryRunner.query(
      `DROP INDEX "idx_innovation_support_log_organisation_unit_innovation_id" ON "innovation_support_log_organisation_unit"`
    );
    await queryRunner.query(
      `DROP INDEX "idx_innovation_support_log_organisation_unit_organisation_unit_id" ON "innovation_support_log_organisation_unit"`
    );
    await queryRunner.query(
      `DROP TABLE "innovation_support_log_organisation_unit"`
    );

    // innovation_support_log table
    await queryRunner.query(
      `ALTER TABLE "innovation_support_log" DROP CONSTRAINT "fk_innovation_support_log_organisation_unit_id"`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_support_log" DROP CONSTRAINT "fk_innovation_support_log_innovation_innovation_id"`
    );

    await queryRunner.query(`DROP TABLE "innovation_support_log"`);
  }
}
