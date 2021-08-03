/*eslint @typescript-eslint/no-unused-vars: ["off", { "varsIgnorePattern": "[qQ]ueryRunner" }]*/

import { QueryRunner } from "typeorm";

import { BaseSeed } from "../tools/bases/base-seed";

export class fixUserOrganisationUnits1627914927008 extends BaseSeed {
  public name = "fixUserOrganisationUnits1627914927008";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `
				DECLARE @originOrgUnitId as nvarchar(100);
				DECLARE @destOrgUnitId as nvarchar(100);
				
				-- RETRIEVE Org Id's
				SELECT @originOrgUnitId = id from organisation_unit where acronym = 'WoE';
				SELECT @destOrgUnitId = id from organisation_unit where acronym = 'WEAHSN';
				
				-- MOVE USERS TO THE NEW UNIT
				UPDATE organisation_unit_user 
				SET organisation_unit_id = @destOrgUnitId
				WHERE organisation_unit_id = @originOrgUnitId;
			`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    // const repo = this.getRepository();
  }
}
