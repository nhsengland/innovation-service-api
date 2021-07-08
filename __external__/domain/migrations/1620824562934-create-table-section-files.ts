import { MigrationInterface, QueryRunner } from "typeorm";

export class createTableSectionFiles1620824562934
  implements MigrationInterface {
  name = "createTableSectionFiles1620824562934";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "innovation_section_file" ("innovation_section_id" uniqueidentifier NOT NULL, "innovation_file_id" uniqueidentifier NOT NULL, CONSTRAINT "pk_innovation_section_file_innovation_section_id_innovation_file_id" PRIMARY KEY ("innovation_section_id", "innovation_file_id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_innovation_section_file_innovation_section_id" ON "innovation_section_file" ("innovation_section_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_innovation_section_file_innovation_file_id" ON "innovation_section_file" ("innovation_file_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_section_file" ADD CONSTRAINT "fk_innovation_section_file_innovation_section_innovation_section_id" FOREIGN KEY ("innovation_section_id") REFERENCES "innovation_section"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_section_file" ADD CONSTRAINT "fk_innovation_section_file_innovation_file_innovation_file_id" FOREIGN KEY ("innovation_file_id") REFERENCES "innovation_file"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation_section_file" DROP CONSTRAINT "fk_innovation_section_file_innovation_file_innovation_file_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_section_file" DROP CONSTRAINT "fk_innovation_section_file_innovation_section_innovation_section_id"`
    );
    await queryRunner.query(
      `DROP INDEX "idx_innovation_section_file_innovation_file_id" ON "innovation_section_file"`
    );
    await queryRunner.query(
      `DROP INDEX "idx_innovation_section_file_innovation_section_id" ON "innovation_section_file"`
    );
    await queryRunner.query(`DROP TABLE "innovation_section_file"`);
  }
}
