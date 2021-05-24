import { MigrationInterface, QueryRunner } from "typeorm";

export class createAssessmentTables1621861108212 implements MigrationInterface {
  name = "createAssessmentTables1621861108212";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // drop constraints
    await queryRunner.query(
      `declare @Command nvarchar(max) = '';
      select @Command = @Command + 'ALTER TABLE [' + t.name + '] DROP CONSTRAINT ' + d.name + CHAR(10)+ CHAR(13) + ';'
      from sys.tables t
        join sys.check_constraints d  on d.parent_object_id = t.object_id  
        join sys.columns c on c.object_id = t.object_id
              and c.column_id = d.parent_column_id
        where t.name in ('innovation','user') and c.name in ('status','type');
      
      execute (@Command);`
    );

    // innovation table
    await queryRunner.query(
      `ALTER TABLE "innovation" ADD CONSTRAINT "CK_innovation_status" CHECK (([status]='COMPLETE' OR [status]='ABANDONED' OR [status]='NEEDS_ASSESSMENT_REVIEW' OR [status]='IN_PROGRESS' OR [status]='WAITING_NEEDS_ASSESSMENT' OR [status]='CREATED' OR [status]='NEEDS_ASSESSMENT'))`
    );

    // user table
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "CK_user_type" CHECK (([type]='ACCESSOR' OR [type]='INNOVATOR' OR [type]='ASSESSMENT'))`
    );

    // innovation_assessment table
    await queryRunner.query(`CREATE TABLE "innovation_assessment" (
      "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_assessment_created_at" DEFAULT getdate(), 
      "created_by" nvarchar(255), 
      "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_assessment_updated_at" DEFAULT getdate(), 
      "updated_by" nvarchar(255), 
      "deleted_at" datetime2, 
      "id" uniqueidentifier NOT NULL CONSTRAINT "df_innovation_assessment_id" DEFAULT NEWSEQUENTIALID(), 
      "description" nvarchar(255), 
      "summary" nvarchar(255), 
      "maturity_level" nvarchar(20), 
      "has_regulatory_approvals" nvarchar(20), 
      "has_regulatory_approvals_comment" nvarchar(150), 
      "has_evidence" nvarchar(20), 
      "has_evidence_comment" nvarchar(150), 
      "has_validation" nvarchar(20), 
      "has_validation_comment" nvarchar(150), 
      "has_proposition" nvarchar(20), 
      "has_proposition_comment" nvarchar(150), 
      "has_competition_knowledge" nvarchar(20), 
      "has_competition_knowledge_comment" nvarchar(150), 
      "has_implementation_plan" nvarchar(20), 
      "has_implementation_plan_comment" nvarchar(150), 
      "has_scale_resource" nvarchar(20), 
      "has_scale_resource_comment" nvarchar(150), 
      "innovation_id" uniqueidentifier NOT NULL, 
      "assign_to_id" nvarchar(255) NOT NULL, 
			[valid_from] datetime2 GENERATED ALWAYS AS ROW START,
			[valid_to] datetime2 GENERATED ALWAYS AS ROW END,
			PERIOD FOR SYSTEM_TIME (valid_from, valid_to),
      CONSTRAINT "pk_innovation_assessment_id" PRIMARY KEY ("id")
		) with (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.innovation_assessment_history, History_retention_period = 7 YEAR));`);

    await queryRunner.query(
      `ALTER TABLE "innovation_assessment" ADD CONSTRAINT "fk_innovation_assessment_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_assessment" ADD CONSTRAINT "fk_innovation_assessment_user_assign_to_id" FOREIGN KEY ("assign_to_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    // innovation_assessment_organisation table
    await queryRunner.query(
      `CREATE TABLE "innovation_assessment_organisation" ("innovation_assessment_id" uniqueidentifier NOT NULL, "organisation_id" uniqueidentifier NOT NULL, CONSTRAINT "pk_innovation_assessment_organisation_innovation_assessment_id_organisation_id" PRIMARY KEY ("innovation_assessment_id", "organisation_id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_innovation_assessment_organisation_innovation_id" ON "innovation_assessment_organisation" ("innovation_assessment_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_innovation_assessment_organisation_organisation_id" ON "innovation_assessment_organisation" ("organisation_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_assessment_organisation" ADD CONSTRAINT "fk_innovation_assessment_organisation_innovation_assessment_id" FOREIGN KEY ("innovation_assessment_id") REFERENCES "innovation_assessment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_assessment_organisation" ADD CONSTRAINT "fk_innovation_assessment_organisation_organisation_id" FOREIGN KEY ("organisation_id") REFERENCES "organisation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // innovation_assessment_organisation table
    await queryRunner.query(
      `ALTER TABLE "innovation_assessment_organisation" DROP CONSTRAINT "fk_innovation_assessment_organisation_innovation_assessment_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_assessment_organisation" DROP CONSTRAINT "fk_innovation_assessment_organisation_organisation_id"`
    );
    await queryRunner.query(
      `DROP INDEX "idx_innovation_assessment_organisation_innovation_id" ON "innovation_assessment_organisation"`
    );
    await queryRunner.query(
      `DROP INDEX "idx_innovation_assessment_organisation_organisation_id" ON "innovation_assessment_organisation"`
    );
    await queryRunner.query(`DROP TABLE "innovation_assessment_organisation"`);

    // innovation_assessment table
    await queryRunner.query(
      `ALTER TABLE "innovation_assessment" DROP CONSTRAINT "fk_innovation_assessment_user_assign_to_id"`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_assessment" DROP CONSTRAINT "fk_innovation_assessment_innovation_innovation_id"`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_assessment" SET ( SYSTEM_VERSIONING = OFF )`
    );
    await queryRunner.query(`DROP TABLE "innovation_assessment"`);
    await queryRunner.query(`DROP TABLE "innovation_assessment_history"`);

    // innovation table
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP CONSTRAINT "CK_innovation_status"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" ADD CONSTRAINT "CK_innovation_status" CHECK (([status]='COMPLETE' OR [status]='ABANDONED' OR [status]='NEEDS_ASSESSMENT_REVIEW' OR [status]='IN_PROGRESS' OR [status]='WAITING_NEEDS_ASSESSMENT'))`
    );

    // user table
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "CK_user_type"`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "CK_user_type" CHECK (([type]='ACCESSOR' OR [type]='INNOVATOR'))`
    );
  }
}
