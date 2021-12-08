import { MigrationInterface, QueryRunner } from "typeorm";

export class migrateSupportLogToActivityLog1638966930402
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // irreversible
  }
}
