import { MigrationInterface, QueryRunner } from "typeorm";

export class createTableInnovationfile1620052916259
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE innovation_file(
                "created_at" datetime2 NOT NULL CONSTRAINT "df_innovationfile_created_at" DEFAULT getdate(),
                "created_by" nvarchar(150),
                "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovationfile_updated_at" DEFAULT getdate(),
                "updated_by" nvarchar(255),
                "is_deleted" bit NOT NULL CONSTRAINT "df_innovationfile_is_deleted" DEFAULT 0,
                "id" uniqueidentifier NOT NULL CONSTRAINT "df_innovationfile_id" DEFAULT NEWSEQUENTIALID(),
                "context" nvarchar(100) NULL,
                "display_file_name" nvarchar(100) NOT NULL,
                "innovation_id" uniqueidentifier NOT NULL,
                CONSTRAINT "pk_innovationfile_id" PRIMARY KEY ("id")
             )`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_file" ADD CONSTRAINT "fk_innovation_file_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation_file" DROP CONSTRAINT "fk_innovation_file_innovation_innovation_id"`
    );
    await queryRunner.query(`DROP TABLE "innovation_file"`);
  }
}
