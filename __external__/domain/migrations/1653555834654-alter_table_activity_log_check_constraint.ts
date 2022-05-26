import { MigrationInterface, QueryRunner } from "typeorm";

export class alterTableActivityLogCheckConstraint1653555834654
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // drop constraints
    await queryRunner.query(
      `declare @Command nvarchar(max) = '';
          select @Command = @Command + 'ALTER TABLE [' + t.name + '] DROP CONSTRAINT ' + d.name + CHAR(10)+ CHAR(13) + ';'
          from sys.tables t
            join sys.check_constraints d  on d.parent_object_id = t.object_id  
            join sys.columns c on c.object_id = t.object_id
                  and c.column_id = d.parent_column_id
            where t.name = 'activity_log' and c.name = 'activity';
          
          execute (@Command);`
    );
    // drop constraints
    await queryRunner.query(
      `declare @Command nvarchar(max) = '';
  select @Command = @Command + 'ALTER TABLE [' + t.name + '] DROP CONSTRAINT ' + d.name + CHAR(10)+ CHAR(13) + ';'
  from sys.tables t
    join sys.check_constraints d  on d.parent_object_id = t.object_id  
    join sys.columns c on c.object_id = t.object_id
          and c.column_id = d.parent_column_id
    where t.name = 'innovation_action' and c.name = 'status';
  
  execute (@Command);`
    );
    // activity_log table
    await queryRunner.query(
      `ALTER TABLE "activity_log" ADD CONSTRAINT "CK_activity_log_activity" 
            CHECK (activity IN ('INNOVATION_CREATION','OWNERSHIP_TRANSFER',
            'SHARING_PREFERENCES_UPDATE','SECTION_DRAFT_UPDATE',
            'SECTION_SUBMISSION','INNOVATION_SUBMISSION',
            'NEEDS_ASSESSMENT_START','NEEDS_ASSESSMENT_COMPLETED',
            'ORGANISATION_SUGGESTION','SUPPORT_STATUS_UPDATE','COMMENT_CREATION',
            'ACTION_CREATION','ACTION_STATUS_IN_REVIEW_UPDATE',
            'ACTION_STATUS_DECLINED_UPDATE','ACTION_STATUS_COMPLETED_UPDATE',
            'ACTION_STATUS_CANCELLED_UPDATE'))`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_action" ADD CONSTRAINT "CK_innovation_action_status" 
      CHECK( status IN ('REQUESTED','STARTED','CONTINUE','IN_REVIEW','DELETED','DECLINED','COMPLETED','CANCELLED') )`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "activity_log" DROP CONSTRAINT "CK_activity_log_activity"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_action" DROP CONSTRAINT "CK_innovation_action_status"`
    );
    await queryRunner.query(
      `ALTER TABLE "activity_log" ADD CONSTRAINT "CK_activity_log_activity" 
            CHECK (activity IN ('INNOVATION_CREATION','OWNERSHIP_TRANSFER','SHARING_PREFERENCES_UPDATE','SECTION_DRAFT_UPDATE','SECTION_SUBMISSION','INNOVATION_SUBMISSION','NEEDS_ASSESSMENT_START','NEEDS_ASSESSMENT_COMPLETED','ORGANISATION_SUGGESTION','SUPPORT_STATUS_UPDATE','COMMENT_CREATION','ACTION_CREATION','ACTION_STATUS_IN_REVIEW_UPDATE','ACTION_STATUS_DECLINED_UPDATE','ACTION_STATUS_COMPLETED_UPDATE'))`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_action" ADD CONSTRAINT "CK_innovation_action_status" 
      CHECK( status IN ('REQUESTED','STARTED','CONTINUE','IN_REVIEW','DELETED','DECLINED','COMPLETED'))`
    );
  }
}
