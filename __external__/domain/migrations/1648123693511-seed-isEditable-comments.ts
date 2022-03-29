import { MigrationInterface, QueryRunner } from "typeorm";

export class seedIsEditableComments1648123693511 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `   UPDATE dbo.comment SET is_editable = 1 
                FROM dbo.comment com INNER JOIN dbo.[user] usr
                ON com.user_id = usr.id 
                WHERE com.innovation_action_id IS NULL 
                AND usr.type IN ('INNOVATOR', 'ACCESSOR')
                AND com.id NOT IN (
                  SELECT DISTINCT cmt.id
                  FROM comment cmt INNER JOIN dbo.[user] usr ON cmt.user_id = usr.id
                  JOIN innovation_support_history ish on CONVERT(VARCHAR(8),cmt.created_at,108) = CONVERT(VARCHAR(8),ish.created_at,108)
                  AND ish.organisation_unit_id = cmt.organisation_unit_id
                  WHERE usr.[type] = 'ACCESSOR'
                  )`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
                UPDATE dbo.comment SET is_editable = 0
            `
    );
  }
}
