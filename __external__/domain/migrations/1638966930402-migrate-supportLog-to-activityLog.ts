import { MigrationInterface, QueryRunner } from "typeorm";

export class migrateSupportLogToActivityLog1638966930402
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

    // Move Activity log data into a temp table
    await queryRunner.query(
      `SELECT * INTO #TempAcitivityLog FROM dbo.activity_log`
    );

    // Insert support logs of type ACCESSOR_SUGGESTION into ActivityLog table (activity - ORGANISATION_SUGGESTION & type - SUPPORT)
    await queryRunner.query(
      `INSERT INTO dbo.activity_log (created_at, created_by, updated_at, updated_by, deleted_at, innovation_id, param, activity, type)
        SELECT
          SL1.created_at, SL1.created_by, SL1.updated_at, SL1.updated_by, SL1.deleted_at, SL1.innovation_id,
          '{"actionUserId":"' + SL1.created_by +'","organisations":[' + stuff((
              select 
              ',"' + OU2.name + '"'
                FROM innovation_support_log SL2
                INNER JOIN innovation_support_log_organisation_unit SLOU2
                ON SL2.id = SLOU2.innovation_support_log_id
                INNER JOIN organisation_unit OU2 on SLOU2.organisation_unit_id = OU2.id
                where SL2.id = SL1.id
              order by OU2.name
              for xml path('')
          ),1,1,'') + ']}', 'ORGANISATION_SUGGESTION', 'SUPPORT' 
        FROM innovation_support_log SL1
        INNER JOIN innovation_support_log_organisation_unit SLOU1
        ON SL1.id = SLOU1.innovation_support_log_id
        INNER JOIN organisation_unit OU1 on SLOU1.organisation_unit_id = OU1.id where SL1.type = 'ACCESSOR_SUGGESTION' 
        and not exists (select 1 from dbo.activity_log AL where AL.created_at = SL1.created_at and AL.created_by = SL1.created_by and AL.activity = 'ORGANISATION_SUGGESTION')
        group by SL1.id, SL1.created_by, SL1.created_at, SL1.created_by, SL1.updated_at, SL1.updated_by, SL1.deleted_at, SL1.innovation_id`
    );

    // Insert support logs of type STATUS_UPDATE into ActivityLog table (activity - SUPPORT_STATUS_UPDATE & type - SUPPORT)
    await queryRunner.query(
      `INSERT INTO dbo.activity_log (created_at, created_by, updated_at, updated_by, deleted_at, innovation_id, param, activity, type)
        SELECT
          SL1.created_at, SL1.created_by, SL1.updated_at, SL1.updated_by, SL1.deleted_at, SL1.innovation_id,
          '{"actionUserId":"' + SL1.created_by +'","organisationUnit":' + ( select 
              '"' + unit.name + '"'
                FROM innovation_support_log SL2
                INNER JOIN organisation_unit unit on SL2.organisation_unit_id = unit.id
                where SL2.id = SL1.id) + ', "innovationSupportStatus":"' + SL1.innovation_support_status + '","comment":{"value": "' + 
                SL1.description +'"}}' , 'SUPPORT_STATUS_UPDATE', 'SUPPORT'
        FROM innovation_support_log SL1
        where SL1.type = 'STATUS_UPDATE' 
        and not exists (select 1 from dbo.activity_log AL where AL.created_at = SL1.created_at and AL.created_by = SL1.created_by and AL.activity = 'SUPPORT_STATUS_UPDATE')`
    );

    // Insert logs into ActivityLog table (activity - INNOVATION_CREATION & type - INNOVATION_MANAGEMENT)
    await queryRunner.query(
      ` INSERT INTO dbo.activity_log (created_at, created_by, innovation_id, param, activity, type)
        SELECT inn.created_at, inn.created_by, inn.id, '{"actionUserId":"' + inn.created_by +'"}', 'INNOVATION_CREATION', 'INNOVATION_MANAGEMENT' FROM innovation inn
        Where not exists (select 1 from dbo.activity_log AL where AL.innovation_id = inn.id and AL.activity = 'INNOVATION_CREATION')
        `
    );

    // Insert logs into ActivityLog table (activity - INNOVATION_SUBMISSION & type - NEEDS_ASSESSMENT)
    await queryRunner.query(
      ` INSERT INTO dbo.activity_log (created_at, created_by, innovation_id, param, activity, type)
        SELECT inn.submitted_at, inn.created_by, inn.id, '{"actionUserId":"' + inn.created_by +'"}', 'INNOVATION_SUBMISSION', 'NEEDS_ASSESSMENT' FROM innovation inn
        WHERE inn.submitted_at is not null
        and not exists (select 1 from dbo.activity_log AL where AL.innovation_id = inn.id and AL.activity = 'INNOVATION_SUBMISSION')  `
    );

    // Insert logs into ActivityLog table (activity - NEEDS_ASSESSMENT_START & type - NEEDS_ASSESSMENT)
    await queryRunner.query(
      ` INSERT INTO dbo.activity_log (created_at, created_by, innovation_id, param, activity, type)
        SELECT IA.created_at, IA.created_by, IA.innovation_id, '{"actionUserId":"' + IA.assign_to_id +'", "assessmentId":"' + convert(nvarchar(50), IA.id) + '"}', 
        'NEEDS_ASSESSMENT_START', 'NEEDS_ASSESSMENT'
        FROM innovation_assessment IA 
        WHERE not exists (select 1 from dbo.activity_log AL where AL.innovation_id = IA.innovation_id and AL.activity = 'NEEDS_ASSESSMENT_START')`
    );

    // Insert logs into ActivityLog table (activity - NEEDS_ASSESSMENT_COMPLETED & type - NEEDS_ASSESSMENT)
    await queryRunner.query(
      ` INSERT INTO dbo.activity_log (created_at, created_by, innovation_id, param, activity, type)
        SELECT IA.finished_at, IA.assign_to_id, IA.innovation_id, '{"actionUserId":"' + IA.assign_to_id +'", "assessmentId":"' + convert(nvarchar(50), IA.id) + '"}', 
        'NEEDS_ASSESSMENT_COMPLETED', 'NEEDS_ASSESSMENT'
        FROM innovation_assessment IA where IA.finished_at is not null
        and not exists (select 1 from dbo.activity_log AL where AL.innovation_id = IA.innovation_id and AL.activity = 'NEEDS_ASSESSMENT_COMPLETED')`
    );

    // Insert logs into ActivityLog table (activity - COMMENT_CREATION & type - COMMENTS)
    await queryRunner.query(
      ` INSERT INTO dbo.activity_log (created_at, created_by, innovation_id, param, activity, type)
  SELECT com.created_at, com.created_by, com.innovation_id,  
	'{"actionUserId":"' + com.created_by +'", "comment":{"id": "'+ convert(nvarchar(50), com.id) +'", "value": "' +  com.message +'"}}',
	 'COMMENT_CREATION', 'COMMENTS'
  FROM comment com
  where com.reply_to_id is null 
  and not exists (select 1 from dbo.activity_log AL where AL.created_at = com.created_at and AL.innovation_id = com.innovation_id and AL.created_by = com.created_by and AL.activity = 'COMMENT_CREATION' )`
    );

    // Insert logs into ActivityLog table (activity - ACTION_CREATION & type - ACTIONS)
    await queryRunner.query(
      ` INSERT INTO dbo.activity_log (created_at, created_by, innovation_id, param, activity, type)
      SELECT IA.created_at, IA.created_by, ISec.innovation_id,  
      '{"actionUserId":"' + IA.created_by +'","sectionId":"' + ISec.section + '","actionId":"' + convert(varchar(50), IA.id) + '", "comment":{"value": "' +  IA.description +'"}}',
       'ACTION_CREATION', 'ACTIONS'
      FROM innovation_action IA INNER JOIN innovation_section ISec ON IA.innovation_section_id = ISec.id
      where not exists (select 1 from dbo.activity_log AL where AL.created_at = IA.created_at and AL.innovation_id = ISec.innovation_id and AL.created_by = IA.created_by and AL.activity = 'ACTION_CREATION' ) `
    );

    // Insert logs into ActivityLog table (activity - ACTION_STATUS_COMPLETED_UPDATE & type - ACTIONS)
    await queryRunner.query(
      ` INSERT INTO dbo.activity_log (created_at, created_by, innovation_id, param, activity, type)
      SELECT IA.updated_at, IA.updated_by, ISec.innovation_id,  
      '{"actionUserId":"' + IA.updated_by +'","actionId":"' + convert(varchar(50), IA.id) + '","comment":{"id": "'+ convert(varchar(50), com.id) +'","value": "' +  com.message +'"}}',
       'ACTION_STATUS_COMPLETED_UPDATE', 'ACTIONS'
      FROM innovation_action IA INNER JOIN innovation_section ISec ON IA.innovation_section_id = ISec.id
      LEFT OUTER JOIN comment com ON IA.id = com.innovation_action_id
      WHERE IA.status = 'COMPLETED' AND dateadd(millisecond, -datepart(millisecond, IA.updated_at), IA.updated_at)  = dateadd(millisecond, -datepart(millisecond, com.created_at), com.created_at) AND IA.updated_by = com.created_by
      AND NOT EXISTS (select 1 from dbo.activity_log AL where AL.created_at = IA.updated_at and AL.innovation_id = ISec.innovation_id and AL.created_by = IA.updated_by and AL.activity = 'ACTION_STATUS_COMPLETED_UPDATE' ) `
    );

    // Insert logs into ActivityLog table (activity - ACTION_STATUS_DECLINED_UPDATE & type - ACTIONS)
    await queryRunner.query(
      `  INSERT INTO dbo.activity_log (created_at, created_by, innovation_id, param, activity, type)
      SELECT IA.updated_at, IA.updated_by, ISec.innovation_id,  
      '{"actionUserId":"' + IA.updated_by +'","actionId":"' + convert(varchar(50), IA.id) + '", "comment":{"id": "'+ convert(varchar(50), com.id) +'","value": "' +  com.message +'"}}',
       'ACTION_STATUS_DECLINED_UPDATE', 'ACTIONS'
      FROM innovation_action IA INNER JOIN innovation_section ISec ON IA.innovation_section_id = ISec.id
      LEFT OUTER JOIN comment com ON IA.id = com.innovation_action_id
      WHERE IA.status = 'DECLINED' AND dateadd(millisecond, -datepart(millisecond, IA.updated_at), IA.updated_at)  = dateadd(millisecond, -datepart(millisecond, com.created_at), com.created_at) AND IA.updated_by = com.created_by
      AND NOT EXISTS (select 1 from dbo.activity_log AL where AL.created_at = IA.updated_at and AL.innovation_id = ISec.innovation_id and AL.created_by = IA.updated_by and AL.activity = 'ACTION_STATUS_DECLINED_UPDATE' )`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(
      `DELETE FROM dbo.activity_log;`
    );
    
    await queryRunner.query(
      `INSERT INTO dbo.activity_log 
      SELECT created_at, created_by, updated_at, updated_by, deleted_at, id, innovation_id, type, activity, param  from #TempAcitivityLog
      `
    );

    await queryRunner.query(
      `DROP TABLE IF EXISTS  #TempAcitivityLog`
    );

  }
}
