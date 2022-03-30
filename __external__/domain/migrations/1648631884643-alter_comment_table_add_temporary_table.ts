import { MigrationInterface, QueryRunner } from "typeorm";

export class alterCommentTableAddTemporaryTable1648631884643
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `  IF NOT EXISTS (SELECT valid_from,valid_to FROM comment)
            BEGIN
            ALTER TABLE comment ADD
            [valid_from] DATETIME2 GENERATED ALWAYS AS ROW START HIDDEN 
            CONSTRAINT DF_valid_from DEFAULT SYSUTCDATETIME(), 
            [valid_to] DATETIME2 GENERATED ALWAYS AS ROW END HIDDEN
            CONSTRAINT DF_valid_to DEFAULT CONVERT(DATETIME2, '9999-12-31 23:59:59.9999999'),
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to);
            END
            `
    );

    await queryRunner.query(
      `ALTER TABLE comment
            SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.comment_history, History_retention_period = 7 YEAR));`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
            ALTER TABLE [dbo].[comment] SET (SYSTEM_VERSIONING = OFF);
            `
    );
    await queryRunner.query(
      `
            ALTER TABLE [dbo].[comment] DROP CONSTRAINT DF_valid_from;
            `
    );
    await queryRunner.query(
      `
            ALTER TABLE [dbo].[comment] DROP CONSTRAINT DF_valid_to;
            `
    );
    await queryRunner.query(
      `
            ALTER TABLE [dbo].[comment] DROP PERIOD FOR SYSTEM_TIME;
            `
    );
    await queryRunner.query(
      `
            ALTER TABLE [dbo].[comment] DROP COLUMN valid_from;
            `
    );
    await queryRunner.query(
      `
            ALTER TABLE [dbo].[comment] DROP COLUMN valid_to;
            `
    );
    await queryRunner.query(
      `DROP TABLE [dbo].[comment_history]
            `
    );
  }
}
