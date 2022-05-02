import { MigrationInterface, QueryRunner } from "typeorm";

export class createTableTermsAndUse1651056597270 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "terms_and_use" (
              "created_at" datetime2 NOT NULL CONSTRAINT "df_terms_and_use_created_at" DEFAULT getdate(), 
              "created_by" nvarchar(255), 
              "updated_at" datetime2 NOT NULL CONSTRAINT "df_terms_and_use_updated_at" DEFAULT getdate(), 
              "updated_by" nvarchar(255), 
              "id" uniqueidentifier NOT NULL CONSTRAINT "df_terms_and_use" DEFAULT NEWSEQUENTIALID(), 
              "name" nvarchar(100) NOT NULL, 
              "tou_type" nvarchar(100) CHECK( tou_type IN ('INNOVATOR', 'SUPPORT_ORGANISATION') ) NOT NULL, 
              "summary" nvarchar(2000),
              "released_at" datetime2,
              CONSTRAINT "pk_terms_and_use_id" PRIMARY KEY ("id"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "terms_and_use"`);
  }
}
