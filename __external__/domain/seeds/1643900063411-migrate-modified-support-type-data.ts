/*eslint @typescript-eslint/no-unused-vars: ["off", { "varsIgnorePattern": "[qQ]ueryRunner" }]*/

import { QueryRunner } from "typeorm";

import { BaseSeed } from "../tools/bases/base-seed";

export class migrateModifiedSupportTypeData1643900063411 extends BaseSeed {
  public name = "migrateModifiedSupportTypeData1643900063411";

  public async up(queryRunner: QueryRunner): Promise<any> {
    // const repo = this.getRepository();
    await queryRunner.query(
      `
        DELETE FROM innovation_support_type 
        WHERE type = 'ADOPTION' AND CAST(created_at as datetime2) < CAST('15-Dec-2021' as datetime2)
      `
    );
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
        AND innovation_id NOT IN (SELECT innovation_id FROM innovation_support_type WHERE type = 'ADOPTION')
      `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    // const repo = this.getRepository();
    await queryRunner.query(
      `
        DELETE FROM innovation_support_type 
        WHERE type = 'ADOPTION' AND CAST(created_at as datetime2) < CAST('15-Dec-2021' as datetime2)
      `
    );
  }
}
