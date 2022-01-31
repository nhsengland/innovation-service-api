/*eslint @typescript-eslint/no-unused-vars: ["off", { "varsIgnorePattern": "[qQ]ueryRunner" }]*/

import { QueryRunner } from "typeorm";

import { BaseSeed } from "../tools/bases/base-seed";

export class migrateSupportTypeData1643281495148 extends BaseSeed {
  public name = "migrateSupportTypeData1643281495148";

  public async up(queryRunner: QueryRunner): Promise<any> {
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
            `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `
        DELETE FROM innovation_support_type 
        WHERE type = 'ADOPTION' AND CAST(created_at as datetime2) < CAST('15-Dec-2021' as datetime2)
        `
    );
  }
}
