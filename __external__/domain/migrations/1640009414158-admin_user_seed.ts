import { MigrationInterface, QueryRunner } from "typeorm";
import * as dotenv from "dotenv";
dotenv.config();

export class adminUserSeed1640009414158 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`


        IF NOT EXISTS (SELECT 1 FROM ROLE WHERE name = 'SERVICE_TEAM')
        BEGIN
        INSERT INTO role(name) VALUES ('SERVICE_TEAM')
        END
        IF NOT EXISTS (SELECT 1 FROM ROLE WHERE name = 'MEMBER')
        BEGIN
        INSERT INTO role(name) VALUES ('MEMBER')
        END
        IF NOT EXISTS (SELECT 1 FROM ROLE WHERE name = 'SUPER_ADMIN')
        BEGIN
        INSERT INTO role(name) VALUES ('SUPER_ADMIN')
        END

        IF NOT EXISTS (SELECT 1 FROM [user] WHERE id = '${process.env.ADMIN_OID}')
        BEGIN
        INSERT INTO [user](id, type) VALUES ('${process.env.ADMIN_OID}', 'ADMIN')
        END

        IF NOT EXISTS (SELECT 1 from user_role ur inner join role r on ur.role_id = r.id where ur.user_id = '${process.env.ADMIN_OID}' and r.name = 'SUPER_ADMIN')
        BEGIN
          INSERT INTO user_role(user_id, role_id)
          SELECT u.id, r.id FROM [user] U
          CROSS JOIN role R
          WHERE u.id = '${process.env.ADMIN_OID}' and r.name = 'SUPER_ADMIN'
        END


        IF NOT EXISTS (SELECT 1 from user_role ur inner join role r on ur.role_id = r.id where ur.user_id = '${process.env.ADMIN_OID}' and r.name = 'SERVICE_TEAM')
        BEGIN
          INSERT INTO user_role(user_id, role_id)
          SELECT u.id, r.id FROM [user] U
          CROSS JOIN role R
          WHERE u.id = '${process.env.ADMIN_OID}' and r.name = 'SERVICE_TEAM'
        END


        IF NOT EXISTS (SELECT 1 from user_role ur inner join role r on ur.role_id = r.id where ur.user_id = '${process.env.ADMIN_OID}' and r.name = 'MEMBER')
        BEGIN
          INSERT INTO user_role(user_id, role_id)
          SELECT u.id, r.id FROM [user] U
          CROSS JOIN role R
          WHERE u.id = '${process.env.ADMIN_OID}' and r.name = 'MEMBER'
        END

      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    //
  }
}
