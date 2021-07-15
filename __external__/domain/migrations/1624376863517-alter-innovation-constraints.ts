import { MigrationInterface, QueryRunner } from "typeorm";

export class alterInnovationConstraints1624376863517
  implements MigrationInterface {
  name = "alterInnovationConstraints1624376863517";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // drop constraints
    await queryRunner.query(
      `declare @Command nvarchar(max) = '';
			select @Command = @Command + 'ALTER TABLE [' + t.name + '] DROP CONSTRAINT ' + d.name + CHAR(10)+ CHAR(13) + ';'
			from sys.tables t
				join sys.check_constraints d  on d.parent_object_id = t.object_id  
				join sys.columns c on c.object_id = t.object_id
							and c.column_id = d.parent_column_id
				where t.name in ('innovation_support') and c.name in ('status');
			
			execute (@Command);`
    );

    // innovation_support table
    await queryRunner.query(
      `ALTER TABLE "innovation_support" ADD CONSTRAINT "CK_innovation_support_status" CHECK (([status] in ('UNASSIGNED','FURTHER_INFO_REQUIRED','WAITING','NOT_YET','ENGAGING','UNSUITABLE','WITHDRAWN','COMPLETE')))`
    );

    // innovation table
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP CONSTRAINT "CK_innovation_status"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" ADD CONSTRAINT "CK_innovation_status" CHECK (([status] in ('COMPLETE','ARCHIVED','NEEDS_ASSESSMENT_REVIEW','IN_PROGRESS','WAITING_NEEDS_ASSESSMENT','CREATED','NEEDS_ASSESSMENT')))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // innovation_support table
    await queryRunner.query(
      `ALTER TABLE "innovation_support" DROP CONSTRAINT "CK_innovation_support_status"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_support" ADD CONSTRAINT "CK_innovation_support_status" CHECK (([status] in ('UNNASSIGNED','FURTHER_INFO_REQUIRED','WAITING','NOT_YET','ENGAGING','UNSUITABLE','WITHDRAWN','COMPLETE')))`
    );

    // innovation table
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP CONSTRAINT "CK_innovation_status"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" ADD CONSTRAINT "CK_innovation_status" CHECK (([status]='COMPLETE' OR [status]='ABANDONED' OR [status]='NEEDS_ASSESSMENT_REVIEW' OR [status]='IN_PROGRESS' OR [status]='WAITING_NEEDS_ASSESSMENT' OR [status]='CREATED' OR [status]='NEEDS_ASSESSMENT'))`
    );
  }
}
