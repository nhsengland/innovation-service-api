import { MigrationInterface, QueryRunner } from "typeorm";

export class alterSystemStateView1634220600994 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
				CREATE OR ALTER VIEW [vw_system_state] AS
				SELECT 
					-- users
					innovatorsQuery.usersTypeINNOVATOR as 'Nr of innovator users',
					innovatorsQuery.usersTypeACCESSOR as 'Nr of accessor users',
					innovatorsQuery.usersTypeASSESSMENT as 'Nr of assessment users',
				
					-- innovation summary
					innovationsQuery.innovationsTotal as 'Total nr of innovations',
					innovationsQuery.innovationsStatusCREATED as 'Nr innovations to submit to needs assessment',
					innovationsQuery.innovationsStatusWAINTINGNA as 'Nr innovations waiting assessment',
					innovationsQuery.innovationsStatusNA as 'Nr innovations in needs assessment',
					innovationsQuery.innovationsStatusINPROGRESS as 'Nr innovations in progress',
					innovationsQuery.innovationsStatusARCHIVED as 'Nr innovations archived',
					innovationsQuery.innovationsStatusCOMPLETE as 'Nr innovations complete',
				
					-- innovation support
					innovationSupportsQuery.iSupportsStatusENGAGING as 'Nr of supports in status engaging',
					innovationSupportsQuery.iSupportsStatusFURTHERIR as 'Nr of supports in status further info required',
					innovationSupportsQuery.iSupportsStatusWAITING as 'Nr of supports in status waiting',
					innovationSupportsQuery.iSupportsStatusNYANDUNSUITABLE as 'Nr of supports in status not yet or unsuitable',
					innovationSupportsQuery.iSupportsStatusCOMPLETE as 'Nr of supports in status complete',
				
					innovationSupportsQuery.iSupportStartedLessTwoWeeks as 'Nr innovations with first support started within 2 weeks after submission',
					ROUND( COALESCE( NULLIF(innovationSupportsQuery.iSupportStartedLessTwoWeeks, 0) * 100.0 / NULLIF(innovationsQuery.innovationsTotal, 0), 0 ), 2) as '% innovations with first support started within 2 weeks after submission',
				
					-- innovation actions
					innovationActionsQuery.iActionsTotal as 'Total number of actions',
					innovationActionsQuery.iActionsStatusREQUESTED as 'Nr actions in status requested for innovators',
					innovationActionsQuery.iActionsStatusSTARTED as 'Nr actions in status started',
					innovationActionsQuery.iActionsStatusCONTINUE as 'Nr actions in status continue',
					innovationActionsQuery.iActionsStatusINREVIEW as 'Nr actions in review by accessors',
					innovationActionsQuery.iActionsStatusDELETED as 'Nr actions deleted by accessors',
					innovationActionsQuery.iActionsStatusDECLINED as 'Nr actions declined by innovators',
					innovationActionsQuery.iActionsStatusCOMPLETED as 'Nr actions completed',
				
					ROUND( COALESCE( NULLIF(innovationActionsQuery.iActionsStatusCOMPLETED, 0) * 100.0 / NULLIF(innovationActionsQuery.iActionsStatusREQUESTED, 0), 0 ), 2) as '% of complete requested actions',
				
					-- innovation assessment
					innovationAssessmentsQuery.iAssessmentStartedLessOneWeek as 'Nr innovations needs assessment started within 1 week after submission',
					ROUND( COALESCE( NULLIF(innovationAssessmentsQuery.iAssessmentStartedLessOneWeek, 0) * 100.0 / NULLIF(innovationsQuery.innovationsTotal, 0), 0 ), 2) as '% innovations needs assessment started within 1 week after submission' 
				FROM 
					-- innovation counts query
					(
						select 
							COUNT(DISTINCT i.id) as innovationsTotal,
							COUNT(CASE WHEN i.status = 'CREATED' then 1 ELSE NULL END) as innovationsStatusCREATED,
							COUNT(CASE WHEN i.status = 'WAITING_NEEDS_ASSESSMENT' then 1 ELSE NULL END) as innovationsStatusWAINTINGNA,
							COUNT(CASE WHEN i.status = 'NEEDS_ASSESSMENT' then 1 ELSE NULL END) as innovationsStatusNA,
							COUNT(CASE WHEN i.status = 'IN_PROGRESS' then 1 ELSE NULL END) as innovationsStatusINPROGRESS,
							COUNT(CASE WHEN i.status = 'ARCHIVED' then 1 ELSE NULL END) as innovationsStatusARCHIVED,
							COUNT(CASE WHEN i.status = 'COMPLETE' then 1 ELSE NULL END) as innovationsStatusCOMPLETE
						from 
							[innovation] i
					) innovationsQuery,
				
					-- innovation supports counts query
					(
						select
							COUNT(CASE WHEN isup.status = 'ENGAGING' then 1 ELSE NULL END) as iSupportsStatusENGAGING,
							COUNT(CASE WHEN isup.status = 'FURTHER_INFO_REQUIRED' then 1 ELSE NULL END) as iSupportsStatusFURTHERIR,
							COUNT(CASE WHEN isup.status = 'WAITING' then 1 ELSE NULL END) as iSupportsStatusWAITING,
							COUNT(CASE WHEN isup.status IN ('NOT_YET', 'UNSUITABLE') then 1 ELSE NULL END) as iSupportsStatusNYANDUNSUITABLE,
							COUNT(CASE WHEN isup.status = 'COMPLETE' then 1 ELSE NULL END) as iSupportsStatusCOMPLETE,
				
							COUNT(CASE WHEN DATEDIFF(minute, i.submitted_at, supportsQuery.min_support_start_date) < 20160 then 1 ELSE NULL END) as iSupportStartedLessTwoWeeks
						from 
							[innovation] i
							left join [innovation_section] isec on isec.innovation_id = i.id and isec.deleted_at is null
							left join [innovation_support] isup on isup.innovation_id = i.id and isup.deleted_at is null
							left join (
								SELECT 
									i.id as innovation_id,
									MIN(isuphist.created_at) as min_support_start_date
								FROM [innovation] i
									inner join [innovation_section] isec on isec.innovation_id = i.id
									inner join [innovation_support_history] isuphist on isuphist.innovation_id = i.id
								WHERE
									isec.deleted_at is null
									and isuphist.status = 'ENGAGING'
								GROUP BY
									i.id
							) supportsQuery on supportsQuery.innovation_id = i.id
					) innovationSupportsQuery,
				
					-- innovation actions counts query
					(
						select
							COUNT(DISTINCT iaction.id) as iActionsTotal,
							COUNT(CASE WHEN iaction.status = 'REQUESTED' then 1 ELSE NULL END) as iActionsStatusREQUESTED,
							COUNT(CASE WHEN iaction.status = 'STARTED' then 1 ELSE NULL END) as iActionsStatusSTARTED,
							COUNT(CASE WHEN iaction.status = 'CONTINUE' then 1 ELSE NULL END) as iActionsStatusCONTINUE,
							COUNT(CASE WHEN iaction.status = 'IN_REVIEW' then 1 ELSE NULL END) as iActionsStatusINREVIEW,
							COUNT(CASE WHEN iaction.status = 'DELETED' then 1 ELSE NULL END) as iActionsStatusDELETED,
							COUNT(CASE WHEN iaction.status = 'DECLINED' then 1 ELSE NULL END) as iActionsStatusDECLINED,
							COUNT(CASE WHEN iaction.status = 'COMPLETED' then 1 ELSE NULL END) as iActionsStatusCOMPLETED
						from
							innovation_action as iaction
							join innovation_section as isec on isec.id = iaction.innovation_section_id
							join innovation as i on i.id = isec.innovation_id
						where
							isec.deleted_at is null
					) innovationActionsQuery,
				
					-- innovation assessment counts query
					(
						select
							COUNT(CASE WHEN DATEDIFF(minute, i.submitted_at, iassessment.created_at) < 10080 then 1 ELSE NULL END) as iAssessmentStartedLessOneWeek
						from 
							innovation_assessment as iassessment
							join innovation as i on i.id = iassessment.innovation_id
					) innovationAssessmentsQuery,
					
					-- user counts query
					(
						select 
							COUNT(CASE WHEN u.type = 'ASSESSMENT' then 1 ELSE NULL END) as usersTypeASSESSMENT,
							COUNT(CASE WHEN u.type = 'ACCESSOR' then 1 ELSE NULL END) as usersTypeACCESSOR,
							COUNT(CASE WHEN u.type = 'INNOVATOR' then 1 ELSE NULL END) as usersTypeINNOVATOR
						from 
							[user] u
						where u.deleted_at is null
					) innovatorsQuery;
			`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
				CREATE OR ALTER VIEW [vw_system_state] AS
					SELECT 
						-- users
						innovatorsQuery.usersTypeINNOVATOR as 'Nr of innovator users',
						innovatorsQuery.usersTypeACCESSOR as 'Nr of accessor users',
						innovatorsQuery.usersTypeASSESSMENT as 'Nr of assessment users',

						-- innovation summary
						innovationsQuery.innovationsTotal as 'Total nr of innovations',
						innovationsQuery.innovationsStatusCREATED as 'Nr innovations to submit to needs assessment',
						innovationsQuery.innovationsStatusWAINTINGNA as 'Nr innovations waiting assessment',
						innovationsQuery.innovationsStatusNA as 'Nr innovations in needs assessment',
						innovationsQuery.innovationsStatusINPROGRESS as 'Nr innovations in progress',
						innovationsQuery.innovationsStatusARCHIVED as 'Nr innovations archived',
						innovationsQuery.innovationsStatusCOMPLETE as 'Nr innovations complete',

						-- innovation support
						innovationsQuery.iSupportsStatusENGAGING as 'Nr of supports in status engaging',
						innovationsQuery.iSupportsStatusFURTHERIR as 'Nr of supports in status further info required',
						innovationsQuery.iSupportsStatusWAITING as 'Nr of supports in status waiting',
						innovationsQuery.iSupportsStatusNYANDUNSUITABLE as 'Nr of supports in status not yet or unsuitable',
						innovationsQuery.iSupportsStatusCOMPLETE as 'Nr of supports in status complete',

						innovationsQuery.iSupportStartedLessTwoWeeks as 'Nr innovations with first support started within 2 weeks after submission',
						ROUND( COALESCE( NULLIF(innovationsQuery.iSupportStartedLessTwoWeeks, 0) * 100.0 / NULLIF(innovationsQuery.innovationsTotal, 0), 0 ), 2) as '% innovations with first support started within 2 weeks after submission',

						-- innovation actions
						innovationsQuery.iActionsTotal as 'Total number of actions',
						innovationsQuery.iActionsStatusREQUESTED as 'Nr actions in status requested for innovators',
						innovationsQuery.iActionsStatusSTARTED as 'Nr actions in status started',
						innovationsQuery.iActionsStatusCONTINUE as 'Nr actions in status continue',
						innovationsQuery.iActionsStatusINREVIEW as 'Nr actions in review by accessors',
						innovationsQuery.iActionsStatusDELETED as 'Nr actions deleted by accessors',
						innovationsQuery.iActionsStatusDECLINED as 'Nr actions declined by innovators',
						innovationsQuery.iActionsStatusCOMPLETED as 'Nr actions completed',

						ROUND( COALESCE( NULLIF(innovationsQuery.iActionsStatusCOMPLETED, 0) * 100.0 / NULLIF(innovationsQuery.iActionsStatusREQUESTED, 0), 0 ), 2) as '% of complete requested actions',

						-- innovation assessment
						innovationsQuery.iAssessmentStartedLessOneWeek as 'Nr innovations needs assessment started within 1 week after submission',
						ROUND( COALESCE( NULLIF(innovationsQuery.iAssessmentStartedLessOneWeek, 0) * 100.0 / NULLIF(innovationsQuery.innovationsTotal, 0), 0 ), 2) as '% innovations needs assessment started within 1 week after submission'

					FROM (
						select 
							-- innovation summary
							COUNT(i.id) as innovationsTotal,
							COUNT(CASE WHEN i.status = 'CREATED' then 1 ELSE NULL END) as innovationsStatusCREATED,
							COUNT(CASE WHEN i.status = 'WAITING_NEEDS_ASSESSMENT' then 1 ELSE NULL END) as innovationsStatusWAINTINGNA,
							COUNT(CASE WHEN i.status = 'NEEDS_ASSESSMENT' then 1 ELSE NULL END) as innovationsStatusNA,
							COUNT(CASE WHEN i.status = 'IN_PROGRESS' then 1 ELSE NULL END) as innovationsStatusINPROGRESS,
							COUNT(CASE WHEN i.status = 'ARCHIVED' then 1 ELSE NULL END) as innovationsStatusARCHIVED,
							COUNT(CASE WHEN i.status = 'COMPLETE' then 1 ELSE NULL END) as innovationsStatusCOMPLETE,

							-- innovation support
							COUNT(CASE WHEN isup.status = 'ENGAGING' then 1 ELSE NULL END) as iSupportsStatusENGAGING,
							COUNT(CASE WHEN isup.status = 'FURTHER_INFO_REQUIRED' then 1 ELSE NULL END) as iSupportsStatusFURTHERIR,
							COUNT(CASE WHEN isup.status = 'WAITING' then 1 ELSE NULL END) as iSupportsStatusWAITING,
							COUNT(CASE WHEN isup.status IN ('NOT_YET', 'UNSUITABLE') then 1 ELSE NULL END) as iSupportsStatusNYANDUNSUITABLE,
							COUNT(CASE WHEN isup.status = 'COMPLETE' then 1 ELSE NULL END) as iSupportsStatusCOMPLETE,

							COUNT(CASE WHEN DATEDIFF(minute, i.submitted_at, supportsQuery.min_support_start_date) < 20160 then 1 ELSE NULL END) as iSupportStartedLessTwoWeeks,

							-- innovation actions
							COUNT(iaction.id) as iActionsTotal,
							COUNT(CASE WHEN iaction.status = 'REQUESTED' then 1 ELSE NULL END) as iActionsStatusREQUESTED,
							COUNT(CASE WHEN iaction.status = 'STARTED' then 1 ELSE NULL END) as iActionsStatusSTARTED,
							COUNT(CASE WHEN iaction.status = 'CONTINUE' then 1 ELSE NULL END) as iActionsStatusCONTINUE,
							COUNT(CASE WHEN iaction.status = 'IN_REVIEW' then 1 ELSE NULL END) as iActionsStatusINREVIEW,
							COUNT(CASE WHEN iaction.status = 'DELETED' then 1 ELSE NULL END) as iActionsStatusDELETED,
							COUNT(CASE WHEN iaction.status = 'DECLINED' then 1 ELSE NULL END) as iActionsStatusDECLINED,
							COUNT(CASE WHEN iaction.status = 'COMPLETED' then 1 ELSE NULL END) as iActionsStatusCOMPLETED,

							-- innovation assessment
							COUNT(CASE WHEN DATEDIFF(minute, i.submitted_at, iassessment.created_at) < 10080 then 1 ELSE NULL END) as iAssessmentStartedLessOneWeek
						from 
							[innovation] i
							left join [innovation_section] isec on isec.innovation_id = i.id and isec.deleted_at is null
							left join [innovation_support] isup on isup.innovation_id = i.id and isup.deleted_at is null
							left join [innovation_assessment] iassessment on iassessment.innovation_id = i.id and iassessment.deleted_at is null
							left join [innovation_action] iaction on iaction.innovation_section_id = isec.id and iaction.deleted_at is null
							left join (
								SELECT 
									i.id as innovation_id,
									MIN(isuphist.created_at) as min_support_start_date
								FROM [innovation] i
									inner join [innovation_section] isec on isec.innovation_id = i.id
									inner join [innovation_support_history] isuphist on isuphist.innovation_id = i.id
								WHERE
									isec.deleted_at is null
									and isuphist.status = 'ENGAGING'
								GROUP BY
									i.id
							) supportsQuery on supportsQuery.innovation_id = i.id
						where
							i.deleted_at is null
					) innovationsQuery,

					(
						select 
							COUNT(CASE WHEN u.type = 'ASSESSMENT' then 1 ELSE NULL END) as usersTypeASSESSMENT,
							COUNT(CASE WHEN u.type = 'ACCESSOR' then 1 ELSE NULL END) as usersTypeACCESSOR,
							COUNT(CASE WHEN u.type = 'INNOVATOR' then 1 ELSE NULL END) as usersTypeINNOVATOR
						from [user] u
						where u.deleted_at is null
					) innovatorsQuery;
			`
    );
  }
}
