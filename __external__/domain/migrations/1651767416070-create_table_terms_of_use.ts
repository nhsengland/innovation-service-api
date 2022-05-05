import { MigrationInterface, QueryRunner } from "typeorm";

export class createTableTermsOfUse1651767416070 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "terms_of_use" (
                    "created_at" datetime2 NOT NULL CONSTRAINT "df_terms_of_use_created_at" DEFAULT getdate(), 
                    "created_by" nvarchar(255), 
                    "updated_at" datetime2 NOT NULL CONSTRAINT "df_terms_of_use_updated_at" DEFAULT getdate(), 
                    "updated_by" nvarchar(255), 
                    "id" uniqueidentifier NOT NULL CONSTRAINT "df_terms_of_use" DEFAULT NEWSEQUENTIALID(), 
                    "name" nvarchar(500) NOT NULL, 
                    "tou_type" nvarchar(100) CHECK( tou_type IN ('INNOVATOR', 'SUPPORT_ORGANISATION') ) NOT NULL, 
                    "summary" nvarchar(2000),
                    "released_at" datetime2,
                    "deleted_at" datetime2,
                    CONSTRAINT "pk_terms_of_use_id" PRIMARY KEY ("id"),
                    CONSTRAINT "unique_name" UNIQUE (name))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "terms_of_use"`);
  }
}
