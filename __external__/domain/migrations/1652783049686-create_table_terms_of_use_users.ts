import { MigrationInterface, QueryRunner } from "typeorm";

export class createTableTermsOfUseUsers1652783049686
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
                                "user_id" uniqueidentifier NOT NULL,
                                "accepted_at" datetime2 NOT NULL,
                                "deleted_at" datetime2,
                                CONSTRAINT "uc_tou_user_idx" UNIQUE ("tou_id", "user_id"),
                                CONSTRAINT "pk_terms_of_use_user_id" PRIMARY KEY ("id"))`
    );

    // ADD Foreign Keys
    await queryRunner.query(
      `ALTER TABLE "terms_of_use_user" ADD CONSTRAINT "fk_terms_of_use_user_tou_id" FOREIGN KEY ("tou_id") REFERENCES "terms_of_use"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "terms_of_use_user" ADD CONSTRAINT "fk_terms_of_use_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "terms_of_use_user"`);
  }
}
