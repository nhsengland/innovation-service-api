import { MigrationInterface, QueryRunner } from "typeorm";

export class createServiceRoleTables1639563073826
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // user table - drop constraints
    await queryRunner.query(
      `declare @Command nvarchar(max) = '';
        select @Command = @Command + 'ALTER TABLE [' + t.name + '] DROP CONSTRAINT ' + d.name + CHAR(10)+ CHAR(13) + ';'
        from sys.tables t
          join sys.check_constraints d  on d.parent_object_id = t.object_id  
          join sys.columns c on c.object_id = t.object_id
                and c.column_id = d.parent_column_id
          where t.name = 'user' and c.name = 'type';
        
        execute (@Command);`
    );

    // user table - update check constraint on 'type' to include Admin user type
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "CK_user_type" CHECK (([type]='ACCESSOR' OR [type]='INNOVATOR' OR [type]='ASSESSMENT' OR [type]='ADMIN'))`
    );

    await queryRunner.query(`
        CREATE TABLE "role" (
            "created_at" datetime2 NOT NULL CONSTRAINT "df_role_created_at" DEFAULT getdate(), 
            "created_by" nvarchar(255), 
            "updated_at" datetime2 NOT NULL CONSTRAINT "df_role_updated_at" DEFAULT getdate(), 
            "updated_by" nvarchar(255),
            "deleted_at" datetime2,
            "id" uniqueidentifier NOT NULL CONSTRAINT "df_role_id" DEFAULT NEWSEQUENTIALID(),
            "name" nvarchar(100) NOT NULL,
            CONSTRAINT "pk_role_id" PRIMARY KEY ("id")
			)
        `);

    await queryRunner.query(`
        CREATE TABLE "service_role" (
            "created_at" datetime2 NOT NULL CONSTRAINT "df_service_role_created_at" DEFAULT getdate(), 
            "created_by" nvarchar(255), 
            "updated_at" datetime2 NOT NULL CONSTRAINT "df_service_role_updated_at" DEFAULT getdate(), 
            "updated_by" nvarchar(255),
            "deleted_at" datetime2,
			      "id" uniqueidentifier NOT NULL CONSTRAINT "df_service_role_id" DEFAULT NEWSEQUENTIALID(),
            "user_id" nvarchar(255) NOT NULL,
            "role_id" uniqueidentifier NOT NULL,
			"active_since" datetime2 NOT NULL CONSTRAINT "df_service_role_active_since" DEFAULT getdate(), 
            CONSTRAINT "pk_service_role_id" PRIMARY KEY ("id"),
			CONSTRAINT "idx_service_role_user_id_role_id" UNIQUE ("user_id", "role_id")
			)
        `);

    await queryRunner.query(`
        ALTER TABLE "service_role" ADD CONSTRAINT "fk_service_role_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        ALTER TABLE "service_role" ADD CONSTRAINT "fk_service_role_role_role_id" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "CK_user_type"`
    );

    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "CK_user_type" CHECK (([type]='ACCESSOR' OR [type]='INNOVATOR' OR [type]='ASSESSMENT'))`
    );

    await queryRunner.query(
      `ALTER TABLE "service_role" DROP CONSTRAINT "fk_service_role_user_user_id"`
    );

    await queryRunner.query(
      `ALTER TABLE "service_role" DROP CONSTRAINT "fk_service_role_role_role_id"`
    );

    await queryRunner.query(`DROP TABLE "service_role"`);

    await queryRunner.query(`DROP TABLE "role"`);
  }
}
