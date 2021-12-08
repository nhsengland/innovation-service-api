import { MigrationInterface, QueryRunner } from "typeorm";

export class createSystemStateViewListQAA1638888782482
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
    CREATE OR ALTER VIEW [vw_system_state_list_A_QA] AS
    SELECT 
		innovationsAQAQuery.Organisation_Name,
		innovationsAQAQuery.Organisation_Unit_Name,
		innovationsAQAQuery.Type,
		innovationsAQAQuery.Role,
		innovationsAQAQuery.iOrganisationRole as 'Nr of ACCESSOR and QUALIFYING_ACCESSOR at each organisation'
    FROM
		(
		SELECT 
			o.name Organisation_Name,
			ou.name as Organisation_Unit_Name , 
			o.[type] as Type, 
			oru.role as Role, 
			count(oru.role) as iOrganisationRole
		from dbo.organisation_unit_user ouu 
			join dbo.organisation_unit ou on ouu.organisation_unit_id = ou.id
			join dbo.organisation o on ou.organisation_id = o.id
			join dbo.organisation_user oru on ouu.organisation_user_id = oru.id
		where ouu.deleted_at is NULL and ou.deleted_at is null and o.deleted_at is NULL and oru.deleted_at is NULL
		GROUP by o.name,o.[type] ,oru.role,ou.name
		)innovationsAQAQuery
      
            `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
    CREATE OR ALTER VIEW [vw_system_state_list_A_QA] AS
    SELECT 
		innovationsAQAQuery.Organisation_Name,
		innovationsAQAQuery.Organisation_Unit_Name,
		innovationsAQAQuery.Type,
		innovationsAQAQuery.Role,
		innovationsAQAQuery.iOrganisationRole as 'Nr of ACCESSOR and QUALIFYING_ACCESSOR at each organisation'
    FROM
		(
		SELECT 
			o.name Organisation_Name,
			ou.name as Organisation_Unit_Name , 
			o.[type] as Type, 
			oru.role as Role, 
			count(oru.role) as iOrganisationRole
		from dbo.organisation_unit_user ouu 
			join dbo.organisation_unit ou on ouu.organisation_unit_id = ou.id
			join dbo.organisation o on ou.organisation_id = o.id
			join dbo.organisation_user oru on ouu.organisation_user_id = oru.id
		where ouu.deleted_at is NULL and ou.deleted_at is null and o.deleted_at is NULL and oru.deleted_at is NULL
		GROUP by o.name,o.[type] ,oru.role,ou.name
		)innovationsAQAQuery
      
            `
    );
  }
}
