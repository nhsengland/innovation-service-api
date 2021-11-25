import { MigrationInterface, QueryRunner } from "typeorm";

export class createActivityLogTable1637135704839 implements MigrationInterface {
  name = "createActivityLogTable1637135704839";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // This table stores activities of type - 'INNOVATION_MANAGEMENT' | 'INNOVATION_RECORD' |
    // 'NEEDS_ASSESSMENT' | 'SUPPORT' | 'COMMENTS' | 'ACTIONS'around an innovation.
    await queryRunner.query(`CREATE TABLE "activity_log" (
                "created_at" datetime2 NOT NULL CONSTRAINT "df_activity_log_created_at" DEFAULT getdate(), 
                "created_by" nvarchar(255), 
                "updated_at" datetime2 NOT NULL CONSTRAINT "df_activity_log_updated_at" DEFAULT getdate(), 
                "updated_by" nvarchar(255),
                "deleted_at" datetime2,
                "id" uniqueidentifier NOT NULL CONSTRAINT "df_activity_log_id" DEFAULT NEWSEQUENTIALID(), 
                "innovation_id" uniqueidentifier NOT NULL, 
                "type" nvarchar(255) CHECK( type IN ('INNOVATION_MANAGEMENT','INNOVATION_RECORD','NEEDS_ASSESSMENT','SUPPORT','COMMENTS','ACTIONS') ) NOT NULL, 
                "activity" nvarchar(255) CHECK( activity IN ('INNOVATION_CREATION','OWNERSHIP_TRANSFER','SHARING_PREFERENCES_UPDATE','SECTION_DRAFT_UPDATE','SECTION_SUBMISSION','INNOVATION_SUBMISSION','NEEDS_ASSESSMENT_START','NEEDS_ASSESSMENT_COMPLETED','ORGANISATION_SUGGESTION','SUPPORT_STATUS_UPDATE','COMMENT_CREATION','ACTION_CREATION','ACTION_STATUS_IN_REVIEW_UPDATE','ACTION_STATUS_DECLINED_UPDATE','ACTION_STATUS_COMPLETED_UPDATE') ) NOT NULL,
                "param" nvarchar(max),
                CONSTRAINT "pk_activity_log_id" PRIMARY KEY ("id"))`);

    await queryRunner.query(
      `ALTER TABLE "activity_log" ADD CONSTRAINT "fk_activity_log_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "activity_log" DROP CONSTRAINT "fk_activity_log_innovation_innovation_id"`
    );

    await queryRunner.query(`DROP TABLE "activity_log"`);
  }
}
