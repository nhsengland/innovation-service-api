import { MigrationInterface, QueryRunner } from "typeorm";

export class createNotificationPreferenceTable1633718634305
  implements MigrationInterface {
  name = "createNotificationPreferenceTable1633718634305";

  public async up(queryRunner: QueryRunner): Promise<void> {
    //This table stores the user preference for email notifications
    await queryRunner.query(`CREATE TABLE "notification_preference" (
            "created_at" datetime2 NOT NULL CONSTRAINT "df_notification_preference_created_at" DEFAULT getdate(), 
            "created_by" nvarchar(255), 
            "updated_at" datetime2 NOT NULL CONSTRAINT "df_notification_preference_updated_at" DEFAULT getdate(), 
            "updated_by" nvarchar(255),
            "deleted_at" datetime2,
            "user_id" nvarchar(255) NOT NULL,
            "notification_id" nvarchar(255) NOT NULL,
            "is_subscribed" bit NOT NULL CONSTRAINT "df_user_is_subscribed" DEFAULT 0,
            CONSTRAINT "pk_notification_preference_id" PRIMARY KEY ("user_id", "notification_id")
              );`);

    await queryRunner.query(
      `ALTER TABLE "notification_preference" ADD CONSTRAINT "fk_notification_preference_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_preference" DROP CONSTRAINT "fk_notification_preference_user_user_id"`
    );

    await queryRunner.query(`DROP TABLE "notification_preference"`);
  }
}
