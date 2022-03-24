import { MigrationInterface, QueryRunner } from "typeorm";

export class seedIsEditableComments1648123693511 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `   UPDATE dbo.comment SET is_editable = 1 
                FROM dbo.comment com INNER JOIN dbo.[user] usr
                ON com.user_id = usr.id 
                LEFT OUTER JOIN dbo.organisation_user orgUsr ON usr.id = orgUsr.user_id
                WHERE com.innovation_action_id IS NULL 
                AND usr.type IN ('INNOVATOR', 'ACCESSOR')
                AND orgUsr.role = 'ACCESSOR'`
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
