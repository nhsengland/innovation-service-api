import { MigrationInterface, QueryRunner } from "typeorm";

export class createSystemStateViewOrganisationLevel1638887434278
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        CREATE OR ALTER VIEW [vw_system_state_organisationlevel] AS
        SELECT 
            innovationsorgQuery.Organisation_Name,
            innovationsorgQuery.Organisation_Unit_Name,
            innovationsorgQuery.iSupportsStatusENGAGING as 'For each org the number of innovations they are engaging with'
        From 
            (
		    select 
            o.name as Organisation_Name,
            ou.name as Organisation_Unit_Name,
			COUNT(CASE WHEN isup.status = 'ENGAGING' then 1 ELSE NULL END) as iSupportsStatusENGAGING
		    from
			innovation_support as isup
			join innovation as i on i.id = isup.innovation_id
			join  organisation_unit ou on ou.id =isup.organisation_unit_id
			join organisation o on o.id=ou.organisation_id
		    where
			isup.deleted_at is null
		    GROUP BY   
	     	o.name,ou.name			
      ) innovationsorgQuery
      
            `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    `DROP VIEW dbo.[vw_system_state_organisationlevel];`;
  }
}
