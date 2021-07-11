import { MigrationInterface, QueryRunner } from "typeorm";

export class notificationAddColumnActivity1626001775301
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    ~(await queryRunner.query(
      `ALTER TABLE "notification" ADD activity_type nvarchar(80) NULL`
    ));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification" DROP COLUMN activity_type`
    );
  }
}
