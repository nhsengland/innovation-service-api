import { MigrationInterface, QueryRunner } from "typeorm";

export class createTableTermsOfUseUser1652187667283
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "terms_of_use_user" (
                          "created_at" datetime2 NOT NULL CONSTRAINT "df_terms_of_use_user_created_at" DEFAULT getdate(), 
                          "created_by" nvarchar(255), 
                          "updated_at" datetime2 NOT NULL CONSTRAINT "df_terms_of_use_user_updated_at" DEFAULT getdate(), 
                          "updated_by" nvarchar(255),
                          "id" uniqueidentifier NOT NULL CONSTRAINT "df_terms_of_use_user" DEFAULT NEWSEQUENTIALID(),
                          "tou_id" uniqueidentifier NOT NULL, 
                          "user_id" nvarchar(255) NOT NULL,
                          "accepted_at" datetime2 NOT NULL,
                          "deleted_at" datetime2,
                          CONSTRAINT "uc_tou_user_idx" UNIQUE ("tou_id", "user_id"),
                          CONSTRAINT "pk_terms_of_use_user_id" PRIMARY KEY ("id"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "terms_of_use_user"`);
  }
}
