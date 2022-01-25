import { MigrationInterface, QueryRunner } from "typeorm";

export class migrateSupportTypeData1643015334322 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
            INSERT INTO innovation_support_type
            (
             created_at
            ,created_by
            ,updated_at
            ,updated_by
            ,type
            ,innovation_id
            ,deleted_at
            )
            SELECT created_at
                ,created_by
                ,updated_at
                ,updated_by
                ,'ADOPTION'
                ,innovation_id      
                ,deleted_at
            FROM innovation_support_type
            WHERE type = 'ASSESSMENT' AND CAST(created_at as datetime2) < CAST('15-Dec-2021' as datetime2)
            `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Action is irreversible as it is only for insert statement.
  }
}
