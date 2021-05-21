import { MigrationInterface, QueryRunner } from "typeorm";

export class alterSoftDeletesColumn1621497169437 implements MigrationInterface {
  name = "alterSoftDeletesColumn1621497169437";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Innovation Table
    await queryRunner.query(
      `ALTER TABLE "innovation" ADD "deleted_at" datetime2`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP CONSTRAINT "df_innovation_is_deleted"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP COLUMN "is_deleted"`
    );

    // InnovationAction Table
    await queryRunner.query(
      `ALTER TABLE "innovation_action" ADD "deleted_at" datetime2`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_action" DROP CONSTRAINT "df_innovation_action_is_deleted"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_action" DROP COLUMN "is_deleted"`
    );

    // InnovationArea Table
    await queryRunner.query(
      `ALTER TABLE "innovation_area" ADD "deleted_at" datetime2`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_area" DROP CONSTRAINT "df_innovation_area_is_deleted"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_area" DROP COLUMN "is_deleted"`
    );

    // InnovationCareSetting Table
    await queryRunner.query(
      `ALTER TABLE "innovation_care_setting" ADD "deleted_at" datetime2`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_care_setting" DROP CONSTRAINT "df_innovation_care_setting_is_deleted"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_care_setting" DROP COLUMN "is_deleted"`
    );

    // InnovationCategory Table
    await queryRunner.query(
      `ALTER TABLE "innovation_category" ADD "deleted_at" datetime2`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_category" DROP CONSTRAINT "df_innovation_category_is_deleted"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_category" DROP COLUMN "is_deleted"`
    );

    // InnovationClinicalArea Table
    await queryRunner.query(
      `ALTER TABLE "innovation_clinical_area" ADD "deleted_at" datetime2`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_clinical_area" DROP CONSTRAINT "df_innovation_clinical_area_is_deleted"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_clinical_area" DROP COLUMN "is_deleted"`
    );

    // InnovationDeploymentPlan Table
    await queryRunner.query(
      `ALTER TABLE "innovation_deployment_plan" ADD "deleted_at" datetime2`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_deployment_plan" DROP CONSTRAINT "df_innovation_deployment_plan_is_deleted"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_deployment_plan" DROP COLUMN "is_deleted"`
    );

    // InnovationEvidence Table
    await queryRunner.query(
      `ALTER TABLE "innovation_evidence" ADD "deleted_at" datetime2`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_evidence" DROP CONSTRAINT "df_innovation_evidence_is_deleted"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_evidence" DROP COLUMN "is_deleted"`
    );

    // InnovationFile Table
    await queryRunner.query(
      `ALTER TABLE "innovation_file" ADD "deleted_at" datetime2`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_file" DROP CONSTRAINT "df_innovationfile_is_deleted"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_file" DROP COLUMN "is_deleted"`
    );

    // InnovationRevenue Table
    await queryRunner.query(
      `ALTER TABLE "innovation_revenue" ADD "deleted_at" datetime2`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_revenue" DROP CONSTRAINT "df_innovation_revenue_is_deleted"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_revenue" DROP COLUMN "is_deleted"`
    );

    // InnovationSection Table
    await queryRunner.query(
      `ALTER TABLE "innovation_section" ADD "deleted_at" datetime2`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_section" DROP CONSTRAINT "df_innovation_section_is_deleted"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_section" DROP COLUMN "is_deleted"`
    );

    // InnovationStandard Table
    await queryRunner.query(
      `ALTER TABLE "innovation_standard" ADD "deleted_at" datetime2`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_standard" DROP CONSTRAINT "df_innovation_standard_is_deleted"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_standard" DROP COLUMN "is_deleted"`
    );

    // InnovationSubgroup Table
    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" ADD "deleted_at" datetime2`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" DROP CONSTRAINT "df_innovation_subgroup_is_deleted"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" DROP COLUMN "is_deleted"`
    );

    // InnovationSupport Table
    await queryRunner.query(
      `ALTER TABLE "innovation_support" ADD "deleted_at" datetime2`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_support" DROP CONSTRAINT "df_innovation_support_is_deleted"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_support" DROP COLUMN "is_deleted"`
    );

    // InnovationSupportType Table
    await queryRunner.query(
      `ALTER TABLE "innovation_support_type" ADD "deleted_at" datetime2`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_support_type" DROP CONSTRAINT "df_innovation_support_type_is_deleted"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_support_type" DROP COLUMN "is_deleted"`
    );

    // InnovationUserTest Table
    await queryRunner.query(
      `ALTER TABLE "innovation_user_test" ADD "deleted_at" datetime2`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_user_test" DROP CONSTRAINT "df_innovation_user_test_is_deleted"`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_user_test" DROP COLUMN "is_deleted"`
    );

    // User Table
    await queryRunner.query(`ALTER TABLE "user" ADD "deleted_at" datetime2`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "df_user_is_deleted"`
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "is_deleted"`);

    // Comment Table
    await queryRunner.query(`ALTER TABLE "comment" ADD "deleted_at" datetime2`);
    await queryRunner.query(
      `ALTER TABLE "comment" DROP CONSTRAINT "df_comment_is_deleted"`
    );
    await queryRunner.query(`ALTER TABLE "comment" DROP COLUMN "is_deleted"`);

    // Notification Table
    await queryRunner.query(
      `ALTER TABLE "notification" ADD "deleted_at" datetime2`
    );
    await queryRunner.query(
      `ALTER TABLE "notification" DROP CONSTRAINT "df_notification_is_deleted"`
    );
    await queryRunner.query(
      `ALTER TABLE "notification" DROP COLUMN "is_deleted"`
    );

    // Organisation Table
    await queryRunner.query(
      `ALTER TABLE "organisation" ADD "deleted_at" datetime2`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation" ADD "acronym" nvarchar(20)`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation" DROP CONSTRAINT "df_organisation_is_deleted"`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation" DROP COLUMN "is_deleted"`
    );

    // OrganisationUnit Table
    await queryRunner.query(
      `ALTER TABLE "organisation_unit" ADD "deleted_at" datetime2`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_unit" DROP CONSTRAINT "df_organisation_unit_is_deleted"`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_unit" DROP COLUMN "is_deleted"`
    );

    // OrganisationUnitUser Table
    await queryRunner.query(
      `ALTER TABLE "organisation_unit_user" ADD "deleted_at" datetime2`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_unit_user" DROP CONSTRAINT "df_organisation_unit_user_is_deleted"`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_unit_user" DROP COLUMN "is_deleted"`
    );

    // OrganisationUser Table
    await queryRunner.query(
      `ALTER TABLE "organisation_user" ADD "deleted_at" datetime2`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_user" DROP CONSTRAINT "df_organisation_user_is_deleted"`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_user" DROP COLUMN "is_deleted"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Innovation Table
    await queryRunner.query(
      `ALTER TABLE "innovation" ADD "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation" DROP COLUMN "deleted_at"`
    );

    // InnovationAction Table
    await queryRunner.query(
      `ALTER TABLE "innovation_action" ADD "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_action_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_action" DROP COLUMN "deleted_at"`
    );

    // InnovationArea Table
    await queryRunner.query(
      `ALTER TABLE "innovation_area" ADD "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_area_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_area" DROP COLUMN "deleted_at"`
    );

    // InnovationCareSetting Table
    await queryRunner.query(
      `ALTER TABLE "innovation_care_setting" ADD "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_care_setting_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_care_setting" DROP COLUMN "deleted_at"`
    );

    // InnovationCategory Table
    await queryRunner.query(
      `ALTER TABLE "innovation_category" ADD "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_category_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_category" DROP COLUMN "deleted_at"`
    );

    // InnovationClinicalArea Table
    await queryRunner.query(
      `ALTER TABLE "innovation_clinical_area" ADD "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_clinical_area_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_clinical_area" DROP COLUMN "deleted_at"`
    );

    // InnovationDeploymentPlan Table
    await queryRunner.query(
      `ALTER TABLE "innovation_deployment_plan" ADD "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_deployment_plan_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_deployment_plan" DROP COLUMN "deleted_at"`
    );

    // InnovationEvidence Table
    await queryRunner.query(
      `ALTER TABLE "innovation_evidence" ADD "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_evidence_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_evidence" DROP COLUMN "deleted_at"`
    );

    // InnovationFile Table
    await queryRunner.query(
      `ALTER TABLE "innovation_file" ADD "is_deleted" bit NOT NULL CONSTRAINT "df_innovationfile_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_file" DROP COLUMN "deleted_at"`
    );

    // InnovationRevenue Table
    await queryRunner.query(
      `ALTER TABLE "innovation_revenue" ADD "is_deleted" bit NOT NULL CONSTRAINT "df_user_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_revenue" DROP COLUMN "deleted_at"`
    );

    // InnovationSection Table
    await queryRunner.query(
      `ALTER TABLE "innovation_section" ADD "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_section_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_section" DROP COLUMN "deleted_at"`
    );

    // InnovationStandard Table
    await queryRunner.query(
      `ALTER TABLE "innovation_standard" ADD "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_standard_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_standard" DROP COLUMN "deleted_at"`
    );

    // InnovationSubgroup Table
    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" ADD "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_subgroup_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_subgroup" DROP COLUMN "deleted_at"`
    );

    // InnovationSupport Table
    await queryRunner.query(
      `ALTER TABLE "innovation_support" ADD "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_support_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_support" DROP COLUMN "deleted_at"`
    );

    // InnovationSupportType Table
    await queryRunner.query(
      `ALTER TABLE "innovation_support_type" ADD "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_support_type_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_support_type" DROP COLUMN "deleted_at"`
    );

    // InnovationUserTest Table
    await queryRunner.query(
      `ALTER TABLE "innovation_user_test" ADD "is_deleted" bit NOT NULL CONSTRAINT "df_innovation_user_test_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "innovation_user_test" DROP COLUMN "deleted_at"`
    );

    // User Table
    await queryRunner.query(
      `ALTER TABLE "user" ADD "is_deleted" bit NOT NULL CONSTRAINT "df_user_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "deleted_at"`);

    // Comment Table
    await queryRunner.query(
      `ALTER TABLE "comment" ADD "is_deleted" bit NOT NULL CONSTRAINT "df_comment_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(`ALTER TABLE "comment" DROP COLUMN "deleted_at"`);

    // Notification Table
    await queryRunner.query(
      `ALTER TABLE "notification" ADD "is_deleted" bit NULL CONSTRAINT "df_notification_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "notification" DROP COLUMN "deleted_at"`
    );

    // Organisation Table
    await queryRunner.query(
      `ALTER TABLE "organisation" ADD "is_deleted" bit NULL CONSTRAINT "df_organisation_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation" DROP COLUMN "deleted_at"`
    );
    await queryRunner.query(`ALTER TABLE "organisation" DROP COLUMN "acronym"`);

    // OrganisationUnit Table
    await queryRunner.query(
      `ALTER TABLE "organisation_unit" ADD "is_deleted" bit NULL CONSTRAINT "df_organisation_unit_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_unit" DROP COLUMN "deleted_at"`
    );

    // OrganisationUnitUser Table
    await queryRunner.query(
      `ALTER TABLE "organisation_unit_user" ADD "is_deleted" bit NULL CONSTRAINT "df_organisation_unit_user_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_unit_user" DROP COLUMN "deleted_at"`
    );

    // OrganisationUser Table
    await queryRunner.query(
      `ALTER TABLE "organisation_user" ADD "is_deleted" bit NULL CONSTRAINT "df_organisation_user_is_deleted" DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_user" DROP COLUMN "deleted_at"`
    );
  }
}
