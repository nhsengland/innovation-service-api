import { MigrationInterface, QueryRunner } from "typeorm";

export class alterInnovationSupportTypeCheck1638433118911
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
          where t.name = 'innovation_support_type' and c.name = 'type';
        
        execute (@Command);`
    );

    // innovation table
    await queryRunner.query(
      `ALTER TABLE "innovation_support_type" ADD CONSTRAINT "CK_innovation_support_type" CHECK (([type]='ADOPTION' OR [type]='ASSESSMENT' OR [type]='PRODUCT_MIGRATION' OR [type]='CLINICAL_TESTS' OR [type]='COMMERCIAL' OR [type]='PROCUREMENT' OR [type]='DEVELOPMENT' OR [type]='EVIDENCE_EVALUATION' OR [type]='FUNDING' OR [type]='INFORMATION'))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation_support_type" DROP CONSTRAINT "CK_innovation_support_type"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_support_type" ADD CONSTRAINT "CK_innovation_support_type" CHECK (([type]='ASSESSMENT' OR [type]='PRODUCT_MIGRATION' OR [type]='CLINICAL_TESTS' OR [type]='COMMERCIAL' OR [type]='PROCUREMENT' OR [type]='DEVELOPMENT' OR [type]='EVIDENCE_EVALUATION' OR [type]='FUNDING' OR [type]='INFORMATION'))`
    );
  }
}
