import { MigrationInterface, QueryRunner } from "typeorm";

export class alterTableNotification1655977859835 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop current notification table
    await queryRunner.dropTable("notification_user", true);

    // Drop current notification table
    await queryRunner.dropTable("notification", true);

    // Create notification table
    await queryRunner.query(
      `CREATE TABLE "notification" (
            "created_at" datetime2 NOT NULL CONSTRAINT "df_notification_created_at" DEFAULT getdate(), 
            "created_by" nvarchar(255), 
            "updated_at" datetime2 NOT NULL CONSTRAINT "df_notification_updated_at" DEFAULT getdate(), 
            "updated_by" nvarchar(255), 
            "deleted_at" datetime2,
            "id" uniqueidentifier NOT NULL CONSTRAINT "df_notification_id" DEFAULT NEWSEQUENTIALID(), 
            "innovation_id" uniqueidentifier NOT NULL,
            "context_type" nvarchar(100) NOT NULL, 
            "context_detail" nvarchar(100) NOT NULL, 
            "context_id" uniqueidentifier NOT NULL,
            "params" nvarchar(255) NULL, 
            CONSTRAINT "pk_notification_id" PRIMARY KEY ("id")
            )`
    );

    await queryRunner.query(
      `ALTER TABLE "notification" ADD CONSTRAINT "fk_notification_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    // context_type constraint
    await queryRunner.query(
      `ALTER TABLE "notification" ADD CONSTRAINT "CK_notification_context_type" 
              CHECK (context_type IN ('INNOVATION','COMMENT',
              'ACTION','NEEDS_ASSESSMENT',
              'SUPPORT'))`
    );

    // context_detail constraint
    await queryRunner.query(
      `ALTER TABLE "notification" ADD CONSTRAINT "CK_notification_context_detail" 
              CHECK (context_detail IN ('LOCK_USER','COMMENT_CREATION',
              'COMMENT_REPLY','ACTION_CREATION',
              'ACTION_UPDATE', 'NEEDS_ASSESSMENT_COMPLETED',
              'NEEDS_ASSESSMENT_ORGANISATION_SUGGESTION', 'INNOVATION_SUBMISSION',
              'SUPPORT_STATUS_UPDATE'))`
    );

    // Create notification_user table
    await queryRunner.query(
      `CREATE TABLE "notification_user" (
            "created_at" datetime2 NOT NULL CONSTRAINT "df_notification_user_created_at" DEFAULT getdate(), 
            "created_by" nvarchar(255), 
            "updated_at" datetime2 NOT NULL CONSTRAINT "df_notification_user_updated_at" DEFAULT getdate(), 
            "updated_by" nvarchar(255), 
            "deleted_at" datetime2,
            "notification_id" uniqueidentifier NOT NULL,
            "user_id" uniqueidentifier NOT NULL,
            "read_at" datetime2,
            CONSTRAINT "pk_notification_user_id" PRIMARY KEY ("notification_id", "user_id")
        )`
    );

    await queryRunner.query(
      `ALTER TABLE "notification_user" ADD CONSTRAINT "fk_notification_user_notification_id" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "notification_user" ADD CONSTRAINT "fk_notification_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notification"`);

    await queryRunner.query(`DROP TABLE "notification_user`);

    await queryRunner.dropTable("notification_user", true);
    await queryRunner.dropTable("notification", true);
  }
}
