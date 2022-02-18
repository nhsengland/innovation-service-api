import { MigrationInterface, QueryRunner } from "typeorm";

export class alterSystemStateViewPrimaryCategoryNew1645171971106
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        CREATE OR ALTER VIEW [vw_system_state] AS

        SELECT 
        -- users
        innovatorsQuery.usersTypeINNOVATOR as 'Nr of innovator users',
        innovatorsQuery.usersTypeACCESSOR as 'Nr of accessor users',
        innovatorsQuery.usersTypeASSESSMENT as 'Nr of assessment users',
        innovatorsDeletedUserQuery.usersTypeDeletedINNOVATOR as 'Nr of accounts deleted',
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
        --innovationSupportsQuery.iSupportsStatusNYANDUNSUITABLE as 'Nr of supports in status not yet or unsuitable',
        innovationSupportsQuery.iSupportsStatusNOTYET as 'Nr of supports in status not yet',
        innovationSupportsQuery.iSupportsStatusUNSUITABLE as 'Nr of supports in status unsuitable',
        innovationSupportsQuery.iSupportsStatusCOMPLETE as 'Nr of supports in status complete',
          innovationSupportsUAQuery.iSupportsStatusUNASSIGNED as'Nr of support status in unassigned',
        (innovationSupportsQuery.iSupportsStatusIdlw) + (innovationSupportsUAQuery.iSupportsStatusUNASSIGNED) as 'Number of idle innovations',
        innovationSupportHistoryQuery.iSupportStartedLessTwoWeeks as 'Nr innovations with first support started within 15 days after submission',
        innovationSupportHistQuery.iSupportStartedMoreTwoWeeks as 'Nr innovations without first support started within 15 days after submission',
        -- innovation actions
        innovationActionsQuery.iActionsTotal as 'Total number of actions',
        innovationActionsQuery.iActionsStatusREQUESTED as 'Nr actions in status requested for innovators',
        --innovationActionsQuery.iActionsStatusSTARTED as 'Nr actions in status started',
        --innovationActionsQuery.iActionsStatusCONTINUE as 'Nr actions in status continue',
        innovationActionsQuery.iActionsStatusINREVIEW as 'Nr actions in review by accessors',
        innovationActionsQuery.iActionsStatusDELETED as 'Nr actions deleted by accessors',
        innovationActionsQuery.iActionsStatusDECLINED as 'Nr actions declined by innovators',
        innovationActionsQuery.iActionsStatusCOMPLETED as 'Nr actions completed',
        
        -- innovation assessment
        innovationAssessmentsQuery.iAssessmentStartedLessOneWeek as 'Nr innovations needs assessment started within 2 working days after submission',
        innovationAssessmentsQuery.iAssessmentNotStartedMoreTwodays as 'Nr innovations needs assessment not started within 2 working days after submission',
        innovationAvgDayNAQuery.iAvgDayBetween as 'Average number of days between account creation and sumbitting for needs assessment',
        
        -- Main category
        innovationsCountBasedOnMainCategory.educationCategory as 'Total number of innovations based on Education category',
        innovationsCountBasedOnMainCategory.ppeCategory as 'Total number of innovations based on PPE category',
        innovationsCountBasedOnMainCategory.pharmaceuticalCategory as 'Total number of innovations based on Pharmaceutical category',
        innovationsCountBasedOnMainCategory.aiCategory as 'Total number of innovations based on AI category',
        innovationsCountBasedOnMainCategory.medicalDeviceCategory as 'Total number of innovations based on Medical Device category',
        innovationsCountBasedOnMainCategory.digitalCategory as 'Total number of innovations based on Digital category',
        innovationsCountBasedOnMainCategory.otherCategory as 'Total number of innovations based on Other category'
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
            --COUNT(CASE WHEN isup.status IN ('NOT_YET', 'UNSUITABLE') then 1 ELSE NULL END) as iSupportsStatusNYANDUNSUITABLE,
            COUNT(CASE WHEN isup.status IN ('NOT_YET') then 1 ELSE NULL END) as iSupportsStatusNOTYET,
            COUNT(CASE WHEN isup.status IN ('UNSUITABLE') then 1 ELSE NULL END) as iSupportsStatusUNSUITABLE,
            COUNT(CASE WHEN isup.status = 'COMPLETE' then 1 ELSE NULL END) as iSupportsStatusCOMPLETE,
            COUNT(CASE WHEN isup.status IN ('COMPLETE','NOT_YET', 'UNSUITABLE','UNASSIGNED') then 1 ELSE NULL END) as iSupportsStatusIdlw
            
            from
            innovation_support as isup
            join innovation as i on i.id = isup.innovation_id 	
            
            where
            isup.deleted_at is null
        ) innovationSupportsQuery,
        (
            select COUNT(CASE WHEN DATEDIFF(minute, i.submitted_at, min_support_start_date) < 30240 then 1 ELSE NULL END) as iSupportStartedLessTwoWeeks
                from innovation as i join (
                SELECT 
                    i.id as innovation_id,
                    MIN(isuphist.created_at) as min_support_start_date
                FROM [innovation] i
                    inner join [innovation_support_history] isuphist on isuphist.innovation_id = i.id
                    WHERE isuphist.status = 'ENGAGING'
                    GROUP BY
                    i.id
                ) supportsQuery on supportsQuery.innovation_id = i.id
                where
                i.deleted_at is null
            ) innovationSupportHistoryQuery,
    
        (
            select
                  COUNT(CASE WHEN DATEDIFF(minute, i.submitted_at, min_support_start_date) > 30240 then 1 ELSE NULL END) as iSupportStartedMoreTwoWeeks
            from innovation as i join (
                SELECT 
                    i.id as innovation_id,
                    MIN(isuphist.created_at) as min_support_start_date
                FROM [innovation] i
                    inner join [innovation_support_history] isuphist on isuphist.innovation_id = i.id
                    WHERE isuphist.status <> 'ENGAGING'
                    GROUP BY
                    i.id
                ) supportsQuery on supportsQuery.innovation_id = i.id
                where
                i.deleted_at is null
            ) innovationSupportHistQuery,
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
                COUNT(CASE WHEN DATEDIFF(minute, i.submitted_at, iassessment.created_at) < 2880 then 1 ELSE NULL END) as iAssessmentStartedLessOneWeek,
                COUNT(CASE WHEN DATEDIFF(minute, i.submitted_at, iassessment.created_at) > 2880 then 1 ELSE NULL END) as iAssessmentNotStartedMoreTwodays
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
                [dbo].[user] u
            where u.deleted_at is null
        ) innovatorsQuery,
        -- deleted user counts query
        (
          select 
              COUNT(CASE WHEN u.type = 'INNOVATOR' then 1 ELSE NULL END) as usersTypeDeletedINNOVATOR
            from 
                [dbo].[user] u
            where u.deleted_at is not null
        ) innovatorsDeletedUserQuery,
        
        (
            select 
                count (CASE WHEN i.status = 'IN_PROGRESS' then 1 ELSE NULL END)  as iSupportsStatusUNASSIGNED
            from innovation i    
            where   i.status = 'IN_PROGRESS' and
            NOT EXISTS(SELECT 1 FROM innovation_support tmp WHERE tmp.innovation_id = i.id and deleted_at is null)
        ) innovationSupportsUAQuery,
        --Average number of days between account creation and sumbitting for needs assessment
        (
            select 
            avg(DATEDIFF(day,u.created_at,i.submitted_at)) as iAvgDayBetween                            							
            from 
            [innovation] i
            join [user] u on  i.created_by=u.id
            where i.status = 'NEEDS_ASSESSMENT' 
            and u.deleted_at is null and i.deleted_at is null
        ) innovationAvgDayNAQuery,
        -- count of innovations based on main category
        (
        select 
          COUNT(CASE WHEN i.main_category = 'EDUCATION' then 1 ELSE NULL END) as educationCategory,
          COUNT(CASE WHEN i.main_category = 'PPE' then 1 ELSE NULL END) as ppeCategory,
          COUNT(CASE WHEN i.main_category = 'PHARMACEUTICAL' then 1 ELSE NULL END) as pharmaceuticalCategory,
          COUNT(CASE WHEN i.main_category = 'AI' then 1 ELSE NULL END) as aiCategory,
          COUNT(CASE WHEN i.main_category = 'MEDICAL_DEVICE' then 1 ELSE NULL END) as medicalDeviceCategory,
          COUNT(CASE WHEN i.main_category = 'DIGITAL' then 1 ELSE NULL END) as digitalCategory,
          COUNT(CASE WHEN i.main_category = 'OTHER' then 1 ELSE NULL END) as otherCategory
        from 
          [dbo].[innovation] as i
        ) innovationsCountBasedOnMainCategory;                  

  

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
        innovatorsDeletedUserQuery.usersTypeDeletedINNOVATOR as 'Nr of accounts deleted',
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
        --innovationSupportsQuery.iSupportsStatusNYANDUNSUITABLE as 'Nr of supports in status not yet or unsuitable',
        innovationSupportsQuery.iSupportsStatusNOTYET as 'Nr of supports in status not yet',
        innovationSupportsQuery.iSupportsStatusUNSUITABLE as 'Nr of supports in status unsuitable',
        innovationSupportsQuery.iSupportsStatusCOMPLETE as 'Nr of supports in status complete',
          innovationSupportsUAQuery.iSupportsStatusUNASSIGNED as'Nr of support status in unassigned',
        (innovationSupportsQuery.iSupportsStatusIdlw) + (innovationSupportsUAQuery.iSupportsStatusUNASSIGNED) as 'Number of idle innovations',
        innovationSupportHistoryQuery.iSupportStartedLessTwoWeeks as 'Nr innovations with first support started within 15 days after submission',
        ROUND( COALESCE( NULLIF(innovationSupportHistoryQuery.iSupportStartedLessTwoWeeks, 0) * 100.0 / NULLIF(innovationsQuery.innovationsTotal, 0), 0 ), 2) as '% innovations with first support started within 15 days after submission',
        innovationSupportHistQuery.iSupportStartedMoreTwoWeeks as 'Nr innovations without first support started within 15 days after submission',
        -- innovation actions
        innovationActionsQuery.iActionsTotal as 'Total number of actions',
        innovationActionsQuery.iActionsStatusREQUESTED as 'Nr actions in status requested for innovators',
        --innovationActionsQuery.iActionsStatusSTARTED as 'Nr actions in status started',
        --innovationActionsQuery.iActionsStatusCONTINUE as 'Nr actions in status continue',
        innovationActionsQuery.iActionsStatusINREVIEW as 'Nr actions in review by accessors',
        innovationActionsQuery.iActionsStatusDELETED as 'Nr actions deleted by accessors',
        innovationActionsQuery.iActionsStatusDECLINED as 'Nr actions declined by innovators',
        innovationActionsQuery.iActionsStatusCOMPLETED as 'Nr actions completed',
    
        ROUND( COALESCE( NULLIF(innovationActionsQuery.iActionsStatusCOMPLETED, 0) * 100.0 / NULLIF(innovationActionsQuery.iActionsStatusREQUESTED, 0), 0 ), 2) as '% of complete requested actions',
    
        -- innovation assessment
        innovationAssessmentsQuery.iAssessmentStartedLessOneWeek as 'Nr innovations needs assessment started within 2 working days after submission',
        ROUND( COALESCE( NULLIF(innovationAssessmentsQuery.iAssessmentStartedLessOneWeek, 0) * 100.0 / NULLIF(innovationsQuery.innovationsTotal, 0), 0 ), 2) as '% innovations needs assessment started within 2 working after submission' ,
        innovationAssessmentsQuery.iAssessmentNotStartedMoreTwodays as 'Nr innovations needs assessment not started within 2 working days after submission',
        innovationAvgDayNAQuery.iAvgDayBetween as 'Average number of days between account creation and sumbitting for needs assessment'
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
            --COUNT(CASE WHEN isup.status IN ('NOT_YET', 'UNSUITABLE') then 1 ELSE NULL END) as iSupportsStatusNYANDUNSUITABLE,
            COUNT(CASE WHEN isup.status IN ('NOT_YET') then 1 ELSE NULL END) as iSupportsStatusNOTYET,
            COUNT(CASE WHEN isup.status IN ('UNSUITABLE') then 1 ELSE NULL END) as iSupportsStatusUNSUITABLE,
            COUNT(CASE WHEN isup.status = 'COMPLETE' then 1 ELSE NULL END) as iSupportsStatusCOMPLETE,
            COUNT(CASE WHEN isup.status IN ('COMPLETE','NOT_YET', 'UNSUITABLE','UNASSIGNED') then 1 ELSE NULL END) as iSupportsStatusIdlw
            
            from
            innovation_support as isup
            join innovation as i on i.id = isup.innovation_id 	
            
            where
            isup.deleted_at is null
        ) innovationSupportsQuery,
        (
            select COUNT(CASE WHEN DATEDIFF(minute, i.submitted_at, min_support_start_date) < 30240 then 1 ELSE NULL END) as iSupportStartedLessTwoWeeks
                from innovation as i join (
                SELECT 
                    i.id as innovation_id,
                    MIN(isuphist.created_at) as min_support_start_date
                FROM [innovation] i
                    inner join [innovation_support_history] isuphist on isuphist.innovation_id = i.id
                    WHERE isuphist.status = 'ENGAGING'
                    GROUP BY
                    i.id
                ) supportsQuery on supportsQuery.innovation_id = i.id
                where
                i.deleted_at is null
            ) innovationSupportHistoryQuery,
    
        (
            select
                  COUNT(CASE WHEN DATEDIFF(minute, i.submitted_at, min_support_start_date) > 30240 then 1 ELSE NULL END) as iSupportStartedMoreTwoWeeks
            from innovation as i join (
                SELECT 
                    i.id as innovation_id,
                    MIN(isuphist.created_at) as min_support_start_date
                FROM [innovation] i
                    inner join [innovation_support_history] isuphist on isuphist.innovation_id = i.id
                    WHERE isuphist.status <> 'ENGAGING'
                    GROUP BY
                    i.id
                ) supportsQuery on supportsQuery.innovation_id = i.id
                where
                i.deleted_at is null
            ) innovationSupportHistQuery,
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
                COUNT(CASE WHEN DATEDIFF(minute, i.submitted_at, iassessment.created_at) < 2880 then 1 ELSE NULL END) as iAssessmentStartedLessOneWeek,
                COUNT(CASE WHEN DATEDIFF(minute, i.submitted_at, iassessment.created_at) > 2880 then 1 ELSE NULL END) as iAssessmentNotStartedMoreTwodays
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
                [dbo].[user] u
            where u.deleted_at is null
        ) innovatorsQuery,
    -- deleted user counts query
        (
          select 
              COUNT(CASE WHEN u.type = 'INNOVATOR' then 1 ELSE NULL END) as usersTypeDeletedINNOVATOR
            from 
                [dbo].[user] u
            where u.deleted_at is not null
        ) innovatorsDeletedUserQuery,
        
        (
            select 
                count (CASE WHEN i.status = 'IN_PROGRESS' then 1 ELSE NULL END)  as iSupportsStatusUNASSIGNED
            from innovation i    
            where   i.status = 'IN_PROGRESS' and
            NOT EXISTS(SELECT 1 FROM innovation_support tmp WHERE tmp.innovation_id = i.id and deleted_at is null)
        ) innovationSupportsUAQuery,
        --Average number of days between account creation and sumbitting for needs assessment
        (
            select 
            avg(DATEDIFF(day,u.created_at,i.submitted_at)) as iAvgDayBetween                            							
            from 
            [innovation] i
            join [user] u on  i.created_by=u.id
            where i.status = 'NEEDS_ASSESSMENT' 
            and u.deleted_at is null and i.deleted_at is null
        ) innovationAvgDayNAQuery;
        
          `
    );
  }
}
