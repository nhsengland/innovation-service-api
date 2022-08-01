import { MigrationInterface, QueryRunner } from "typeorm";

export class alterNotificationPreferencesTable1659043099708
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_preference" ADD "preference" nvarchar(100) NOT NULL CONSTRAINT "df_notification_preference_preference" DEFAULT 'INSTANTLY';`
    );

    await queryRunner.query(
      `UPDATE notification_preference SET preference = 'NEVER' WHERE is_subscribed = 0;`
    );

    await queryRunner.query(
      `ALTER TABLE "notification_preference" DROP CONSTRAINT "df_user_is_subscribed"`
    );

    await queryRunner.query(
      `ALTER TABLE "notification_preference" DROP COLUMN is_subscribed`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_preference" ADD "is_subscribed" bit NOT NULL CONSTRAINT "df_user_is_subscribed" DEFAULT 1;`
    );

    await queryRunner.query(
      `UPDATE notification_preference SET is_subscribed = 0 WHERE preference = 'NEVER';`
    );

    await queryRunner.query(
      `ALTER TABLE "notification_preference" DROP CONSTRAINT "df_notification_preference_preference"`
    );

    await queryRunner.query(
      `ALTER TABLE "notification_preference" DROP COLUMN preference`
    );
  }
}
