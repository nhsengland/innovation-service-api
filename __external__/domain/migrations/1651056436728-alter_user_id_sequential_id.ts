import { MigrationInterface, QueryRunner } from "typeorm";

export class alterUserIdSequentialId1651056436728
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        /*
        DROP CONSTRAINTS
        */

        ALTER TABLE "user_role" DROP CONSTRAINT "fk_user_role_user_user_id"
        ALTER TABLE "innovation" DROP CONSTRAINT "fk_innovation_user_owner_id"
        ALTER TABLE "comment" DROP CONSTRAINT "fk_comment_user_user_id"
        ALTER TABLE "notification_preference" DROP CONSTRAINT "fk_notification_preference_user_user_id"
        ALTER TABLE "organisation_user" DROP CONSTRAINT "fk_organisation_user_user_user_id"
        ALTER TABLE "notification_user" DROP CONSTRAINT "fk_notification_user_user_id"
        ALTER TABLE "innovation_assessment" DROP CONSTRAINT "fk_innovation_assessment_user_assign_to_id"

        ALTER TABLE "user_role" DROP CONSTRAINT "idx_user_role_user_id_role_id"
        ALTER TABLE "notification_preference" DROP CONSTRAINT pk_notification_preference_id
        ALTER TABLE "organisation_user" DROP CONSTRAINT "uc_organisation_user_idx"

        ALTER TABLE [notification_user] DROP CONSTRAINT pk_notification_user_id


        ALTER TABLE [user]
        DROP CONSTRAINT pk_user_id

        ALTER TABLE [user]
        ALTER COLUMN id nvarchar(255) NOT NULL

	    	ALTER TABLE [user]
        ALTER COLUMN id uniqueidentifier NOT NULL

        ALTER TABLE [user]
        ADD CONSTRAINT pk_user_id PRIMARY KEY(id)

        ALTER TABLE [user]
        ADD DEFAULT NEWSEQUENTIALID() FOR id

        ALTER TABLE user_role
        ALTER COLUMN user_id uniqueidentifier NOT NULL

        ALTER TABLE innovation
        ALTER COLUMN owner_id uniqueidentifier NOT NULL

        ALTER TABLE comment
        ALTER COLUMN user_id uniqueidentifier NOT NULL

        ALTER TABLE notification_preference
        ALTER COLUMN user_id uniqueidentifier NOT NULL

        ALTER TABLE [notification_preference]
        ADD CONSTRAINT pk_notification_preference_id PRIMARY KEY(user_id, notification_id)

        ALTER TABLE organisation_user
        ALTER COLUMN user_id uniqueidentifier NOT NULL

        ALTER TABLE notification_user
        ALTER COLUMN user_id uniqueidentifier NOT NULL

        ALTER TABLE [notification_user]
        ADD CONSTRAINT pk_notification_user_id PRIMARY KEY(notification_id, user_id)

        ALTER TABLE innovation_assessment
        ALTER COLUMN assign_to_id uniqueidentifier NOT NULL


        /*
        ADD CONSTRAINTS
        */
        ALTER TABLE "user_role" ADD CONSTRAINT "fk_user_role_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        ALTER TABLE "innovation" ADD CONSTRAINT "fk_innovation_user_owner_id" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        ALTER TABLE "comment" ADD CONSTRAINT "fk_comment_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        ALTER TABLE "notification_preference" ADD CONSTRAINT "fk_notification_preference_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        ALTER TABLE "organisation_user" ADD CONSTRAINT "fk_organisation_user_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        ALTER TABLE "notification_user" ADD CONSTRAINT "fk_notification_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        ALTER TABLE "innovation_assessment" ADD CONSTRAINT "fk_innovation_assessment_user_assign_to_id" FOREIGN KEY ("assign_to_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        ALTER TABLE "user_role" ADD CONSTRAINT "idx_user_role_user_id_role_id" UNIQUE ("user_id", "role_id")
        ALTER TABLE "organisation_user" ADD CONSTRAINT "uc_organisation_user_idx" UNIQUE ("organisation_id", "user_id")


      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        ALTER TABLE [user]
        DROP CONSTRAINT pk_user_id
        ALTER TABLE [user]
        DROP CONSTRAINT df_user_id
        ALTER TABLE [user]
        ALTER COLUMN id nvarchar(255) NOT NULL
        ALTER TABLE [user]
        ADD CONSTRAINT pk_user_id PRIMARY KEY(id)
      `
    );
  }
}
