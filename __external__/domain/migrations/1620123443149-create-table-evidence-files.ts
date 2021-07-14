import { MigrationInterface, QueryRunner } from "typeorm";

export class createTableEvidenceFiles1620123443149
  implements MigrationInterface
{
  name = "createTableEvidenceFiles1620123443149";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "innovation_evidence_file" ("innovation_evidence_id" uniqueidentifier NOT NULL, "innovation_file_id" uniqueidentifier NOT NULL, CONSTRAINT "pk_innovation_evidence_file_innovation_evidence_id_innovation_file_id" PRIMARY KEY ("innovation_evidence_id", "innovation_file_id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_innovation_evidence_file_innovation_evidence_id" ON "innovation_evidence_file" ("innovation_evidence_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_innovation_evidence_file_innovation_file_id" ON "innovation_evidence_file" ("innovation_file_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_evidence_file" ADD CONSTRAINT "fk_innovation_evidence_file_innovation_evidence_innovation_evidence_id" FOREIGN KEY ("innovation_evidence_id") REFERENCES "innovation_evidence"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_evidence_file" ADD CONSTRAINT "fk_innovation_evidence_file_innovation_file_innovation_file_id" FOREIGN KEY ("innovation_file_id") REFERENCES "innovation_file"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation_evidence_file" DROP CONSTRAINT "fk_innovation_evidence_file_innovation_file_innovation_file_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_evidence_file" DROP CONSTRAINT "fk_innovation_evidence_file_innovation_evidence_innovation_evidence_id"`
    );
    await queryRunner.query(
      `DROP INDEX "idx_innovation_evidence_file_innovation_file_id" ON "innovation_evidence_file"`
    );
    await queryRunner.query(
      `DROP INDEX "idx_innovation_evidence_file_innovation_evidence_id" ON "innovation_evidence_file"`
    );
    await queryRunner.query(`DROP TABLE "innovation_evidence_file"`);
  }
}
