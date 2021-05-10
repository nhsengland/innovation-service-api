import { MigrationInterface, QueryRunner } from "typeorm";

export class initDbSetup1619539369845 implements MigrationInterface {
  name = "initDbSetup1619539369845";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user" ("created_at" datetime2 NOT NULL CONSTRAINT "df_user_created_at" DEFAULT getdate(), "created_by" nvarchar(255), "updated_at" datetime2 NOT NULL CONSTRAINT "df_user_updated_at" DEFAULT getdate(), "updated_by" nvarchar(255), "is_deleted" bit NOT NULL CONSTRAINT "df_user_is_deleted" DEFAULT 0, "id" nvarchar(255) NOT NULL, "type" nvarchar(255) CHECK( type IN ('INNOVATOR','ACCESSOR') ) NOT NULL, CONSTRAINT "pk_user_id" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE TABLE "innovation_section" (
            "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_section_created_at" DEFAULT getdate(), 
            "created_by" nvarchar(255), 
            "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_section_updated_at" DEFAULT getdate(), 
            "updated_by" nvarchar(255), "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_section_is_deleted" DEFAULT 0, 
            "id" uniqueidentifier NOT NULL CONSTRAINT "df_innovation_section_id" DEFAULT NEWSEQUENTIALID(), 
            "section" nvarchar(255) CHECK( section IN ('INNOVATION_DESCRIPTION','VALUE_PROPOSITION','UNDERSTANDING_OF_NEEDS','UNDERSTANDING_OF_BENEFITS','EVIDENCE_OF_EFFECTIVENESS','MARKET_RESEARCH','INTELLECTUAL_PROPERTY','REGULATIONS_AND_STANDARDS','CURRENT_CARE_PATHWAY','TESTING_WITH_USERS','COST_OF_INNOVATION','COMPARATIVE_COST_BENEFIT','REVENUE_MODEL','IMPLEMENTATION_PLAN') ) NOT NULL, 
            "status" nvarchar(255) CHECK( status IN ('NOT_STARTED','DRAFT','SUBMITTED') ) NOT NULL, 
            "innovation_id" uniqueidentifier NOT NULL, 
            [valid_from] datetime2 GENERATED ALWAYS AS ROW START,
            [valid_to] datetime2 GENERATED ALWAYS AS ROW END,
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to),
            CONSTRAINT "pk_innovation_section_id" PRIMARY KEY ("id")
        ) with (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.innovation_section_history, History_retention_period = 7 YEAR));`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_innovation_section_section_innovation_id" ON "innovation_section" ("section", "innovation_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "organisation" (
        "created_at" datetime2 NOT NULL CONSTRAINT "df_organisation_created_at" DEFAULT getdate(), 
        "created_by" nvarchar(255), 
        "updated_at" datetime2 NOT NULL CONSTRAINT "df_organisation_updated_at" DEFAULT getdate(), 
        "updated_by" nvarchar(255), 
        "is_deleted" bit NOT NULL CONSTRAINT "df_organisation_is_deleted" DEFAULT 0,
        "id" uniqueidentifier NOT NULL CONSTRAINT "df_organisation_id" DEFAULT NEWSEQUENTIALID(), 
        "name" nvarchar(100) NOT NULL, 
        "type" nvarchar(255) CHECK( type IN ('INNOVATOR','ACCESSOR') ) NOT NULL, 
        "size" nvarchar(255), 
        "is_shadow" bit NOT NULL CONSTRAINT "df_organisation_is_shadow" DEFAULT 0, 
        CONSTRAINT "pk_organisation_id" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "organisation_unit" ("created_at" datetime2 NOT NULL CONSTRAINT "df_organisation_unit_created_at" DEFAULT getdate(), "created_by" nvarchar(255), "updated_at" datetime2 NOT NULL CONSTRAINT "df_organisation_unit_updated_at" DEFAULT getdate(), "updated_by" nvarchar(255), "is_deleted" bit NOT NULL CONSTRAINT "df_organisation_unit_is_deleted" DEFAULT 0, "id" uniqueidentifier NOT NULL CONSTRAINT "df_organisation_unit_id" DEFAULT NEWSEQUENTIALID(), "name" nvarchar(255) NOT NULL, "organisation_id" uniqueidentifier NOT NULL, CONSTRAINT "pk_organisation_unit_id" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "organisation_user" ("created_at" datetime2 NOT NULL CONSTRAINT "df_organisation_user_created_at" DEFAULT getdate(), "created_by" nvarchar(255), "updated_at" datetime2 NOT NULL CONSTRAINT "df_organisation_user_updated_at" DEFAULT getdate(), "updated_by" nvarchar(255), "is_deleted" bit NOT NULL CONSTRAINT "df_organisation_user_is_deleted" DEFAULT 0, "id" uniqueidentifier NOT NULL CONSTRAINT "df_organisation_user_id" DEFAULT NEWSEQUENTIALID(), "role" nvarchar(50) NOT NULL, "organisation_id" uniqueidentifier NOT NULL, "user_id" nvarchar(255) NOT NULL, CONSTRAINT "uc_organisation_user_idx" UNIQUE ("organisation_id", "user_id"), CONSTRAINT "chk_organisation_user_roles" CHECK ("role" IN ('ACCESSOR','QUALIFYING_ACCESSOR','INNOVATOR_OWNER')), CONSTRAINT "pk_organisation_user_id" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "organisation_unit_user" ("created_at" datetime2 NOT NULL CONSTRAINT "df_organisation_unit_user_created_at" DEFAULT getdate(), "created_by" nvarchar(255), "updated_at" datetime2 NOT NULL CONSTRAINT "df_organisation_unit_user_updated_at" DEFAULT getdate(), "updated_by" nvarchar(255), "is_deleted" bit NOT NULL CONSTRAINT "df_organisation_unit_user_is_deleted" DEFAULT 0, "id" uniqueidentifier NOT NULL CONSTRAINT "df_organisation_unit_user_id" DEFAULT NEWSEQUENTIALID(), "organisation_unit_id" uniqueidentifier NOT NULL, "organisation_user_id" uniqueidentifier NOT NULL, CONSTRAINT "uc_org_unit_org_user_idx" UNIQUE ("organisation_unit_id", "organisation_user_id"), CONSTRAINT "pk_organisation_unit_user_id" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE TABLE "innovation_support" (
            "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_support_created_at" DEFAULT getdate(), 
            "created_by" nvarchar(255), 
            "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_support_updated_at" DEFAULT getdate(), 
            "updated_by" nvarchar(255), 
            "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_support_is_deleted" DEFAULT 0, 
            "id" uniqueidentifier NOT NULL CONSTRAINT "df_innovation_support_id" DEFAULT NEWSEQUENTIALID(), 
            "status" nvarchar(255) CHECK( status IN ('UNNASSIGNED','FURTHER_INFO_REQUIRED','WAITING','NOT_YET','ENGAGING','UNSUITABLE','WITHDRAWN','COMPLETE') ) NOT NULL, 
            "innovation_id" uniqueidentifier NOT NULL, 
            "organisation_user_id" uniqueidentifier NOT NULL, 
            [valid_from] datetime2 GENERATED ALWAYS AS ROW START,
            [valid_to] datetime2 GENERATED ALWAYS AS ROW END,
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to),
            CONSTRAINT "uc_inno_support_org_unit_inno_idx" UNIQUE ("organisation_user_id", "innovation_id"), 
            CONSTRAINT "pk_innovation_support_id" PRIMARY KEY ("id")
        ) with (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.innovation_support_history, History_retention_period = 7 YEAR));`);
    await queryRunner.query(`CREATE TABLE "innovation_action" (
            "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_action_created_at" DEFAULT getdate(), 
            "created_by" nvarchar(255), 
            "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_action_updated_at" DEFAULT getdate(), 
            "updated_by" nvarchar(255), 
            "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_action_is_deleted" DEFAULT 0, 
            "id" uniqueidentifier NOT NULL CONSTRAINT "df_innovation_action_id" DEFAULT NEWSEQUENTIALID(), 
            "message" nvarchar(255) NOT NULL, 
            "status" nvarchar(255) CHECK( status IN ('REQUESTED','STARTED','CONTINUE','IN_REVIEW','DELETED','DECLINED','COMPLETED') ) NOT NULL, 
            "innovation_section_id" uniqueidentifier NOT NULL, 
            "innovation_support_id" uniqueidentifier NOT NULL, 
            "assign_to_id" nvarchar(255) NOT NULL,
            [valid_from] datetime2 GENERATED ALWAYS AS ROW START,
            [valid_to] datetime2 GENERATED ALWAYS AS ROW END,
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to),
            CONSTRAINT "pk_innovation_action_id" PRIMARY KEY ("id")
        ) with (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.innovation_action_history, History_retention_period = 7 YEAR));`);
    await queryRunner.query(
      `CREATE TABLE "comment" ("created_at" datetime2 NOT NULL CONSTRAINT "df_comment_created_at" DEFAULT getdate(), "created_by" nvarchar(255), "updated_at" datetime2 NOT NULL CONSTRAINT "df_comment_updated_at" DEFAULT getdate(), "updated_by" nvarchar(255), "is_deleted" bit NOT NULL CONSTRAINT "df_comment_is_deleted" DEFAULT 0, "id" uniqueidentifier NOT NULL CONSTRAINT "df_comment_id" DEFAULT NEWSEQUENTIALID(), "message" nvarchar(255) NOT NULL, "user_id" nvarchar(255) NOT NULL, "innovation_id" uniqueidentifier NOT NULL, "innovation_action_id" uniqueidentifier, "reply_to_id" uniqueidentifier, CONSTRAINT "pk_comment_id" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE TABLE "innovation_subgroup" (
            "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_subgroup_created_at" DEFAULT getdate(), 
            "created_by" nvarchar(255), 
            "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_subgroup_updated_at" DEFAULT getdate(), 
            "updated_by" nvarchar(255), "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_subgroup_is_deleted" DEFAULT 0, 
            "id" uniqueidentifier NOT NULL CONSTRAINT "df_innovation_subgroup_id" DEFAULT NEWSEQUENTIALID(), 
            "name" nvarchar(255) NOT NULL, "conditions" nvarchar(255), 
            "benefits" nvarchar(255), 
            "care_pathway" nvarchar(255), 
            "cost_description" nvarchar(255), 
            "patients_range" nvarchar(255), 
            "sell_expectations" nvarchar(255), 
            "usage_expectations" nvarchar(255), 
            "cost_comparison" nvarchar(255), 
            "innovation_id" uniqueidentifier NOT NULL, 
            [valid_from] datetime2 GENERATED ALWAYS AS ROW START,
            [valid_to] datetime2 GENERATED ALWAYS AS ROW END,
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to),
            CONSTRAINT "pk_innovation_subgroup_id" PRIMARY KEY ("id")
        ) with (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.innovation_subgroup_history, History_retention_period = 7 YEAR));`);
    await queryRunner.query(`CREATE TABLE "innovation_area" (
            "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_area_created_at" DEFAULT getdate(), 
            "created_by" nvarchar(255), 
            "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_area_updated_at" DEFAULT getdate(), 
            "updated_by" nvarchar(255), 
            "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_area_is_deleted" DEFAULT 0, 
            "type" nvarchar(255) CHECK( type IN ('COVID_19','DATA_ANALYTICS_AND_RESEARCH','DIGITALISING_SYSTEM','IMPROVING_SYSTEM_FLOW','INDEPENDENCE_AND_PREVENTION','OPERATIONAL_EXCELLENCE','PATIENT_ACTIVATION_AND_SELF_CARE','PATIENT_SAFETY','WORKFORCE_OPTIMISATION') ) NOT NULL, 
            "innovation_id" uniqueidentifier NOT NULL, 
            [valid_from] datetime2 GENERATED ALWAYS AS ROW START,
            [valid_to] datetime2 GENERATED ALWAYS AS ROW END,
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to),
            CONSTRAINT "pk_innovation_area_type_innovation_id" PRIMARY KEY ("type", "innovation_id")
        ) with (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.innovation_area_history, History_retention_period = 7 YEAR));`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_innovation_area_type_innovation_id" ON "innovation_area" ("type", "innovation_id") `
    );
    await queryRunner.query(`CREATE TABLE "innovation_care_setting" (
            "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_care_setting_created_at" DEFAULT getdate(), 
            "created_by" nvarchar(255), 
            "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_care_setting_updated_at" DEFAULT getdate(), 
            "updated_by" nvarchar(255), 
            "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_care_setting_is_deleted" DEFAULT 0, 
            "type" nvarchar(255) CHECK( type IN ('AMBULANCE_OR_PARAMEDIC','COMMUNITY','HOSPITAL_INPATIENT','HOSPITAL_OUTPATIENT','MENTAL_HEALTH','PATIENT_HOME','PHARMACY','PRIMARY_CARE','SOCIAL_CARE') ) NOT NULL, 
            "innovation_id" uniqueidentifier NOT NULL, 
            [valid_from] datetime2 GENERATED ALWAYS AS ROW START,
            [valid_to] datetime2 GENERATED ALWAYS AS ROW END,
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to),
            CONSTRAINT "pk_innovation_care_setting_type_innovation_id" PRIMARY KEY ("type", "innovation_id")
        ) with (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.innovation_care_setting_history, History_retention_period = 7 YEAR));`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_innovation_care_setting_type_innovation_id" ON "innovation_care_setting" ("type", "innovation_id") `
    );
    await queryRunner.query(`CREATE TABLE "innovation_category" (
            "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_category_created_at" DEFAULT getdate(), 
            "created_by" nvarchar(255), 
            "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_category_updated_at" DEFAULT getdate(), 
            "updated_by" nvarchar(255), "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_category_is_deleted" DEFAULT 0, 
            "type" nvarchar(255) CHECK( type IN ('MEDICAL_DEVICE','PHARMACEUTICAL','DIGITAL','AI','EDUCATION','PPE','OTHER') ) NOT NULL, 
            "innovation_id" uniqueidentifier NOT NULL, 
            [valid_from] datetime2 GENERATED ALWAYS AS ROW START,
            [valid_to] datetime2 GENERATED ALWAYS AS ROW END,
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to),
            CONSTRAINT "pk_innovation_category_type_innovation_id" PRIMARY KEY ("type", "innovation_id")
        ) with (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.innovation_category_history, History_retention_period = 7 YEAR));`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_innovation_category_type_innovation_id" ON "innovation_category" ("type", "innovation_id") `
    );
    await queryRunner.query(`CREATE TABLE "innovation_clinical_area" (
            "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_clinical_area_created_at" DEFAULT getdate(), 
            "created_by" nvarchar(255), 
            "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_clinical_area_updated_at" DEFAULT getdate(), 
            "updated_by" nvarchar(255), 
            "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_clinical_area_is_deleted" DEFAULT 0, 
            "type" nvarchar(255) CHECK( type IN ('ACUTE','AGEING','CANCER','CARDIO_ENDOCRINE_METABOLIC','CHILDREN_AND_YOUNG','DISEASE_AGNOSTIC','GASTRO_KDNEY_LIVER','INFECTION_INFLAMATION','MATERNITY_REPRODUCTIVE_HEALTH','MENTAL_HEALTH','NEUROLOGY','POPULATION_HEALTH','RESPIRATORY','UROLOGY','WORKFORCE_AND_EDUCATION') ) NOT NULL, 
            "innovation_id" uniqueidentifier NOT NULL, 
            [valid_from] datetime2 GENERATED ALWAYS AS ROW START,
            [valid_to] datetime2 GENERATED ALWAYS AS ROW END,
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to),
            CONSTRAINT "pk_innovation_clinical_area_type_innovation_id" PRIMARY KEY ("type", "innovation_id")
        ) with (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.innovation_clinical_area_history, History_retention_period = 7 YEAR));`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_innovation_clinical_area_type_innovation_id" ON "innovation_clinical_area" ("type", "innovation_id") `
    );
    await queryRunner.query(`CREATE TABLE "innovation_deployment_plan" (
            "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_deployment_plan_created_at" DEFAULT getdate(), 
            "created_by" nvarchar(255), 
            "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_deployment_plan_updated_at" DEFAULT getdate(), 
            "updated_by" nvarchar(255), 
            "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_deployment_plan_is_deleted" DEFAULT 0, 
            "id" uniqueidentifier NOT NULL CONSTRAINT "df_innovation_deployment_plan_id" DEFAULT NEWSEQUENTIALID(), 
            "name" nvarchar(255) NOT NULL, 
            "commercial_basis" nvarchar(255), 
            "org_deployment_affect" nvarchar(255), 
            "innovation_id" uniqueidentifier NOT NULL, 
            [valid_from] datetime2 GENERATED ALWAYS AS ROW START,
            [valid_to] datetime2 GENERATED ALWAYS AS ROW END,
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to),
            CONSTRAINT "pk_innovation_deployment_plan_id" PRIMARY KEY ("id")
        ) with (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.innovation_deployment_plan_history, History_retention_period = 7 YEAR));`);
    await queryRunner.query(`CREATE TABLE "innovation_evidence" (
            "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_evidence_created_at" DEFAULT getdate(), 
            "created_by" nvarchar(255), 
            "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_evidence_updated_at" DEFAULT getdate(), 
            "updated_by" nvarchar(255), 
            "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_evidence_is_deleted" DEFAULT 0, 
            "id" uniqueidentifier NOT NULL CONSTRAINT "df_innovation_evidence_id" DEFAULT NEWSEQUENTIALID(), 
            "name" nvarchar(255) NOT NULL, 
            "summary" nvarchar(255), 
            "evidence_type" nvarchar(255), 
            "clinical_evidence_type" nvarchar(255), 
            "description" nvarchar(255), 
            "innovation_id" uniqueidentifier NOT NULL, 
            [valid_from] datetime2 GENERATED ALWAYS AS ROW START,
            [valid_to] datetime2 GENERATED ALWAYS AS ROW END,
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to),
            CONSTRAINT "pk_innovation_evidence_id" PRIMARY KEY ("id")
        ) with (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.innovation_evidence_history, History_retention_period = 7 YEAR));`);
    await queryRunner.query(`CREATE TABLE "innovation_regulation_standard" (
            "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_regulation_standard_created_at" DEFAULT getdate(), 
            "created_by" nvarchar(255), 
            "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_regulation_standard_updated_at" DEFAULT getdate(), 
            "updated_by" nvarchar(255), 
            "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_regulation_standard_is_deleted" DEFAULT 0, 
            "id" uniqueidentifier NOT NULL CONSTRAINT "df_innovation_regulation_standard_id" DEFAULT NEWSEQUENTIALID(), 
            "type" nvarchar(255) CHECK( type IN ('CE_UKCA','DATA_PROTECTION_2018','DTAC','HUMAN_MED_REGULATION_2012','MED_DEVICE_REGULATION_2017_745','UK_MDR_2002','OTHER') ) NOT NULL, 
            "regulation_standard_met" nvarchar(255) NOT NULL, 
            "innovation_id" uniqueidentifier NOT NULL, 
            [valid_from] datetime2 GENERATED ALWAYS AS ROW START,
            [valid_to] datetime2 GENERATED ALWAYS AS ROW END,
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to),
            CONSTRAINT "pk_innovation_regulation_standard_id" PRIMARY KEY ("id")
        ) with (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.innovation_regulation_standard_history, History_retention_period = 7 YEAR));`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_innovation_regulation_standard_type_innovation_id" ON "innovation_regulation_standard" ("type", "innovation_id") `
    );
    await queryRunner.query(`CREATE TABLE "innovation_revenue" (
            "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_revenue_created_at" DEFAULT getdate(), 
            "created_by" nvarchar(255), 
            "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_revenue_updated_at" DEFAULT getdate(), 
            "updated_by" nvarchar(255), 
            "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_revenue_is_deleted" DEFAULT 0, 
            "type" nvarchar(255) CHECK( type IN ('ADVERTISING','DIRECT_PRODUCT_SALES','FEE_FOR_SERVICE','LEASE','SALES_OF_CONSUMABLES_OR_ACCESSORIES','SUBSCRIPTION','OTHER') ) NOT NULL, 
            "innovation_id" uniqueidentifier NOT NULL, 
            [valid_from] datetime2 GENERATED ALWAYS AS ROW START,
            [valid_to] datetime2 GENERATED ALWAYS AS ROW END,
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to),
            CONSTRAINT "pk_innovation_revenue_type_innovation_id" PRIMARY KEY ("type", "innovation_id")
        ) with (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.innovation_revenue_history, History_retention_period = 7 YEAR));`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_innovation_revenue_type_innovation_id" ON "innovation_revenue" ("type", "innovation_id") `
    );
    await queryRunner.query(`CREATE TABLE "innovation_user_test" (
            "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_user_test_created_at" DEFAULT getdate(), 
            "created_by" nvarchar(255), 
            "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_user_test_updated_at" DEFAULT getdate(), 
            "updated_by" nvarchar(255), 
            "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_user_test_is_deleted" DEFAULT 0, 
            "id" uniqueidentifier NOT NULL CONSTRAINT "df_innovation_user_test_id" DEFAULT NEWSEQUENTIALID(), 
            "kind" nvarchar(255) NOT NULL, 
            "feedback" nvarchar(255), 
            "innovation_id" uniqueidentifier NOT NULL, 
            [valid_from] datetime2 GENERATED ALWAYS AS ROW START,
            [valid_to] datetime2 GENERATED ALWAYS AS ROW END,
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to),
            CONSTRAINT "pk_innovation_user_test_id" PRIMARY KEY ("id")
        ) with (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.innovation_user_test_history, History_retention_period = 7 YEAR));`);
    await queryRunner.query(`CREATE TABLE "innovation" (
            "created_at" datetime2 NOT NULL CONSTRAINT "df_innovation_created_at" DEFAULT getdate(), 
            "created_by" nvarchar(255), 
            "updated_at" datetime2 NOT NULL CONSTRAINT "df_innovation_updated_at" DEFAULT getdate(), 
            "updated_by" nvarchar(255), 
            "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_is_deleted" DEFAULT 0, 
            "id" uniqueidentifier NOT NULL CONSTRAINT "df_innovation_id" DEFAULT NEWSEQUENTIALID(), 
            "name" nvarchar(100) NOT NULL, 
            "status" nvarchar(255) CHECK( status IN ('WAITING_NEEDS_ASSESSMENT','IN_PROGRESS','NEEDS_ASSESSMENT_REVIEW','ABANDONED','COMPLETE') ) NOT NULL, 
            "survey_id" nvarchar(255) NOT NULL, 
            "description" nvarchar(255), 
            "country_name" nvarchar(100) NOT NULL, 
            "postcode" nvarchar(20), 
            "other_category_description" nvarchar(255), 
            "has_final_product" nvarchar(255), 
            "main_purpose" nvarchar(255), 
            "problems_trackled" nvarchar(255), 
            "problems_consequences" nvarchar(255), 
            "intervention" nvarchar(255), 
            "intervention_impact" nvarchar(255), 
            "has_subgroups" nvarchar(255), 
            "has_benefits" nvarchar(255), 
            "benefits" nvarchar(255), 
            "has_evidence" nvarchar(255), 
            "has_market_research" nvarchar(255), 
            "market_research" nvarchar(255), 
            "has_patents" nvarchar(255), 
            "has_other_intellectual" nvarchar(255), 
            "other_intellectual" nvarchar(255), 
            "has_regulation_knowledge" nvarchar(255), 
            "other_regulation_description" nvarchar(255), 
            "has_uk_pathway_knowledge" nvarchar(255), 
            "innovation_pathway_knowledge" nvarchar(255), 
            "potential_pathway" nvarchar(255), 
            "has_tests" nvarchar(255), 
            "has_cost_knowledge" nvarchar(255), 
            "has_cost_saving_knowledge" nvarchar(255), 
            "has_cost_care_knowledge" nvarchar(255), 
            "has_revenue_model" nvarchar(255), 
            "paying_organisations" nvarchar(255), 
            "benefitting_organisations" nvarchar(255), 
            "has_funding" nvarchar(255), 
            "funding_description" nvarchar(255), 
            "has_deploy_plan" nvarchar(255), 
            "is_deployed" nvarchar(255), 
            "has_resources_to_scale" nvarchar(255), 
            "owner_id" nvarchar(255) NOT NULL, 
            [valid_from] datetime2 GENERATED ALWAYS AS ROW START,
            [valid_to] datetime2 GENERATED ALWAYS AS ROW END,
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to),
            CONSTRAINT "UQ_a12c9bdde3b857e71ab2a77c0d6" UNIQUE ("survey_id"), 
            CONSTRAINT "pk_innovation_id" PRIMARY KEY ("id")
        ) with (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.innovation_history, History_retention_period = 7 YEAR));`);
    await queryRunner.query(
      `CREATE TABLE "notification" ("created_at" datetime2 NOT NULL CONSTRAINT "df_notification_created_at" DEFAULT getdate(), "created_by" nvarchar(255), "updated_at" datetime2 NOT NULL CONSTRAINT "df_notification_updated_at" DEFAULT getdate(), "updated_by" nvarchar(255), "is_deleted" bit NOT NULL CONSTRAINT "df_notification_is_deleted" DEFAULT 0, "id" uniqueidentifier NOT NULL CONSTRAINT "df_notification_id" DEFAULT NEWSEQUENTIALID(), "message" nvarchar(255) NOT NULL, "is_read" bit NOT NULL CONSTRAINT "df_notification_is_read" DEFAULT 0, "user_id" nvarchar(255) NOT NULL, CONSTRAINT "pk_notification_id" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "innovation_support_user" ("innovation_support_id" uniqueidentifier NOT NULL, "organisation_unit_user_id" uniqueidentifier NOT NULL, CONSTRAINT "pk_innovation_support_user_innovation_support_id_organisation_unit_user_id" PRIMARY KEY ("innovation_support_id", "organisation_unit_user_id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_innovation_support_user_innovation_support_id" ON "innovation_support_user" ("innovation_support_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_innovation_support_user_organisation_unit_user_id" ON "innovation_support_user" ("organisation_unit_user_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "innovation_share" ("innovation_id" uniqueidentifier NOT NULL, "organisation_id" uniqueidentifier NOT NULL, CONSTRAINT "pk_innovation_share_innovation_id_organisation_id" PRIMARY KEY ("innovation_id", "organisation_id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_innovation_share_innovation_id" ON "innovation_share" ("innovation_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_innovation_share_organisation_id" ON "innovation_share" ("organisation_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_section" ADD CONSTRAINT "fk_innovation_section_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_unit" ADD CONSTRAINT "fk_organisation_unit_organisation_organisation_id" FOREIGN KEY ("organisation_id") REFERENCES "organisation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_user" ADD CONSTRAINT "fk_organisation_user_organisation_organisation_id" FOREIGN KEY ("organisation_id") REFERENCES "organisation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_user" ADD CONSTRAINT "fk_organisation_user_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_unit_user" ADD CONSTRAINT "fk_organisation_unit_user_organisation_unit_organisation_unit_id" FOREIGN KEY ("organisation_unit_id") REFERENCES "organisation_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_unit_user" ADD CONSTRAINT "fk_organisation_unit_user_organisation_user_organisation_user_id" FOREIGN KEY ("organisation_user_id") REFERENCES "organisation_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_support" ADD CONSTRAINT "fk_innovation_support_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_support" ADD CONSTRAINT "fk_innovation_support_organisation_unit_organisation_user_id" FOREIGN KEY ("organisation_user_id") REFERENCES "organisation_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_action" ADD CONSTRAINT "fk_innovation_action_innovation_section_innovation_section_id" FOREIGN KEY ("innovation_section_id") REFERENCES "innovation_section"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_action" ADD CONSTRAINT "fk_innovation_action_innovation_support_innovation_support_id" FOREIGN KEY ("innovation_support_id") REFERENCES "innovation_support"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_action" ADD CONSTRAINT "fk_innovation_action_user_assign_to_id" FOREIGN KEY ("assign_to_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "comment" ADD CONSTRAINT "fk_comment_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "comment" ADD CONSTRAINT "fk_comment_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "comment" ADD CONSTRAINT "fk_comment_innovation_action_innovation_action_id" FOREIGN KEY ("innovation_action_id") REFERENCES "innovation_action"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "comment" ADD CONSTRAINT "fk_comment_comment_reply_to_id" FOREIGN KEY ("reply_to_id") REFERENCES "comment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" ADD CONSTRAINT "fk_innovation_subgroup_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_area" ADD CONSTRAINT "fk_innovation_area_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_care_setting" ADD CONSTRAINT "fk_innovation_care_setting_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_category" ADD CONSTRAINT "fk_innovation_category_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_clinical_area" ADD CONSTRAINT "fk_innovation_clinical_area_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_deployment_plan" ADD CONSTRAINT "fk_innovation_deployment_plan_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_evidence" ADD CONSTRAINT "fk_innovation_evidence_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_regulation_standard" ADD CONSTRAINT "fk_innovation_regulation_standard_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_revenue" ADD CONSTRAINT "fk_innovation_revenue_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_user_test" ADD CONSTRAINT "fk_innovation_user_test_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" ADD CONSTRAINT "fk_innovation_user_owner_id" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "notification" ADD CONSTRAINT "fk_notification_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_support_user" ADD CONSTRAINT "fk_innovation_support_user_innovation_support_innovation_support_id" FOREIGN KEY ("innovation_support_id") REFERENCES "innovation_support"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_support_user" ADD CONSTRAINT "fk_innovation_support_user_organisation_unit_user_organisation_unit_user_id" FOREIGN KEY ("organisation_unit_user_id") REFERENCES "organisation_unit_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_share" ADD CONSTRAINT "fk_innovation_share_innovation_innovation_id" FOREIGN KEY ("innovation_id") REFERENCES "innovation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_share" ADD CONSTRAINT "fk_innovation_share_organisation_organisation_id" FOREIGN KEY ("organisation_id") REFERENCES "organisation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "innovation_share" DROP CONSTRAINT "fk_innovation_share_organisation_organisation_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_share" DROP CONSTRAINT "fk_innovation_share_innovation_innovation_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_support_user" DROP CONSTRAINT "fk_innovation_support_user_organisation_unit_user_organisation_unit_user_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_support_user" DROP CONSTRAINT "fk_innovation_support_user_innovation_support_innovation_support_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "notification" DROP CONSTRAINT "fk_notification_user_user_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP CONSTRAINT "fk_innovation_user_owner_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_user_test" DROP CONSTRAINT "fk_innovation_user_test_innovation_innovation_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_revenue" DROP CONSTRAINT "fk_innovation_revenue_innovation_innovation_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_regulation_standard" DROP CONSTRAINT "fk_innovation_regulation_standard_innovation_innovation_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_evidence" DROP CONSTRAINT "fk_innovation_evidence_innovation_innovation_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_deployment_plan" DROP CONSTRAINT "fk_innovation_deployment_plan_innovation_innovation_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_clinical_area" DROP CONSTRAINT "fk_innovation_clinical_area_innovation_innovation_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_category" DROP CONSTRAINT "fk_innovation_category_innovation_innovation_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_care_setting" DROP CONSTRAINT "fk_innovation_care_setting_innovation_innovation_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_area" DROP CONSTRAINT "fk_innovation_area_innovation_innovation_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" DROP CONSTRAINT "fk_innovation_subgroup_innovation_innovation_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "comment" DROP CONSTRAINT "fk_comment_comment_reply_to_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "comment" DROP CONSTRAINT "fk_comment_innovation_action_innovation_action_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "comment" DROP CONSTRAINT "fk_comment_innovation_innovation_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "comment" DROP CONSTRAINT "fk_comment_user_user_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_action" DROP CONSTRAINT "fk_innovation_action_user_assign_to_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_action" DROP CONSTRAINT "fk_innovation_action_innovation_support_innovation_support_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_action" DROP CONSTRAINT "fk_innovation_action_innovation_section_innovation_section_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_support" DROP CONSTRAINT "fk_innovation_support_organisation_unit_organisation_user_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_support" DROP CONSTRAINT "fk_innovation_support_innovation_innovation_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_unit_user" DROP CONSTRAINT "fk_organisation_unit_user_organisation_user_organisation_user_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_unit_user" DROP CONSTRAINT "fk_organisation_unit_user_organisation_unit_organisation_unit_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_user" DROP CONSTRAINT "fk_organisation_user_user_user_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_user" DROP CONSTRAINT "fk_organisation_user_organisation_organisation_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_unit" DROP CONSTRAINT "fk_organisation_unit_organisation_organisation_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_section" DROP CONSTRAINT "fk_innovation_section_innovation_innovation_id"`
    );
    await queryRunner.query(
      `DROP INDEX "idx_innovation_share_organisation_id" ON "innovation_share"`
    );
    await queryRunner.query(
      `DROP INDEX "idx_innovation_share_innovation_id" ON "innovation_share"`
    );
    await queryRunner.query(`DROP TABLE "innovation_share"`);
    await queryRunner.query(
      `DROP INDEX "idx_innovation_support_user_organisation_unit_user_id" ON "innovation_support_user"`
    );
    await queryRunner.query(
      `DROP INDEX "idx_innovation_support_user_innovation_support_id" ON "innovation_support_user"`
    );
    await queryRunner.query(`DROP TABLE "innovation_support_user"`);
    await queryRunner.query(`DROP TABLE "notification"`);

    await queryRunner.query(
      `ALTER TABLE "innovation" SET ( SYSTEM_VERSIONING = OFF )`
    );
    await queryRunner.query(`DROP TABLE "innovation"`);
    await queryRunner.query(`DROP TABLE "innovation_history"`);

    await queryRunner.query(
      `ALTER TABLE "innovation_user_test" SET ( SYSTEM_VERSIONING = OFF )`
    );
    await queryRunner.query(`DROP TABLE "innovation_user_test"`);
    await queryRunner.query(`DROP TABLE "innovation_user_test_history"`);

    await queryRunner.query(
      `DROP INDEX "idx_innovation_revenue_type_innovation_id" ON "innovation_revenue"`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_revenue" SET ( SYSTEM_VERSIONING = OFF )`
    );
    await queryRunner.query(`DROP TABLE "innovation_revenue"`);
    await queryRunner.query(`DROP TABLE "innovation_revenue_history"`);

    await queryRunner.query(
      `DROP INDEX "idx_innovation_regulation_standard_type_innovation_id" ON "innovation_regulation_standard"`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_regulation_standard" SET ( SYSTEM_VERSIONING = OFF )`
    );
    await queryRunner.query(`DROP TABLE "innovation_regulation_standard"`);
    await queryRunner.query(
      `DROP TABLE "innovation_regulation_standard_history"`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_evidence" SET ( SYSTEM_VERSIONING = OFF )`
    );
    await queryRunner.query(`DROP TABLE "innovation_evidence"`);
    await queryRunner.query(`DROP TABLE "innovation_evidence_history"`);

    await queryRunner.query(
      `ALTER TABLE "innovation_deployment_plan" SET ( SYSTEM_VERSIONING = OFF )`
    );
    await queryRunner.query(`DROP TABLE "innovation_deployment_plan"`);
    await queryRunner.query(`DROP TABLE "innovation_deployment_plan_history"`);

    await queryRunner.query(
      `DROP INDEX "idx_innovation_clinical_area_type_innovation_id" ON "innovation_clinical_area"`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_clinical_area" SET ( SYSTEM_VERSIONING = OFF )`
    );
    await queryRunner.query(`DROP TABLE "innovation_clinical_area"`);
    await queryRunner.query(`DROP TABLE "innovation_clinical_area_history"`);

    await queryRunner.query(
      `DROP INDEX "idx_innovation_category_type_innovation_id" ON "innovation_category"`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_category" SET ( SYSTEM_VERSIONING = OFF )`
    );
    await queryRunner.query(`DROP TABLE "innovation_category"`);
    await queryRunner.query(`DROP TABLE "innovation_category_history"`);

    await queryRunner.query(
      `DROP INDEX "idx_innovation_care_setting_type_innovation_id" ON "innovation_care_setting"`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_care_setting" SET ( SYSTEM_VERSIONING = OFF )`
    );
    await queryRunner.query(`DROP TABLE "innovation_care_setting"`);
    await queryRunner.query(`DROP TABLE "innovation_care_setting_history"`);

    await queryRunner.query(
      `DROP INDEX "idx_innovation_area_type_innovation_id" ON "innovation_area"`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_area" SET ( SYSTEM_VERSIONING = OFF )`
    );
    await queryRunner.query(`DROP TABLE "innovation_area"`);
    await queryRunner.query(`DROP TABLE "innovation_area_history"`);

    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" SET ( SYSTEM_VERSIONING = OFF )`
    );
    await queryRunner.query(`DROP TABLE "innovation_subgroup"`);
    await queryRunner.query(`DROP TABLE "innovation_subgroup_history"`);

    await queryRunner.query(`DROP TABLE "comment"`);

    await queryRunner.query(
      `ALTER TABLE "innovation_action" SET ( SYSTEM_VERSIONING = OFF )`
    );
    await queryRunner.query(`DROP TABLE "innovation_action"`);
    await queryRunner.query(`DROP TABLE "innovation_action_history"`);

    await queryRunner.query(
      `ALTER TABLE "innovation_support" SET ( SYSTEM_VERSIONING = OFF )`
    );
    await queryRunner.query(`DROP TABLE "innovation_support"`);
    await queryRunner.query(`DROP TABLE "innovation_support_history"`);

    await queryRunner.query(`DROP TABLE "organisation_unit_user"`);
    await queryRunner.query(`DROP TABLE "organisation_user"`);
    await queryRunner.query(`DROP TABLE "organisation_unit"`);
    await queryRunner.query(`DROP TABLE "organisation"`);
    await queryRunner.query(
      `DROP INDEX "idx_innovation_section_section_innovation_id" ON "innovation_section"`
    );

    await queryRunner.query(
      `ALTER TABLE "innovation_section" SET ( SYSTEM_VERSIONING = OFF )`
    );
    await queryRunner.query(`DROP TABLE "innovation_section"`);
    await queryRunner.query(`DROP TABLE "innovation_section_history"`);

    await queryRunner.query(`DROP TABLE "user"`);
  }
}
