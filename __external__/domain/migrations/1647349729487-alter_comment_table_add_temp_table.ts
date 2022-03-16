import { MigrationInterface, QueryRunner } from "typeorm";

export class alterCommentTableAddTempTable1647349729487
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `   ALTER TABLE comment
             ADD
             SysStartTime DATETIME2 GENERATED ALWAYS AS ROW START HIDDEN
             CONSTRAINT DF_SysStart DEFAULT SYSUTCDATETIME()
             , SysEndTime DATETIME2 GENERATED ALWAYS AS ROW END HIDDEN
             CONSTRAINT DF_SysEnd DEFAULT CONVERT(DATETIME2, '9999-12-31 23:59:59.9999999'),
             PERIOD FOR SYSTEM_TIME (SysStartTime, SysEndTime);

            ALTER TABLE comment
                SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.comment_history));
        `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    //
  }
}
