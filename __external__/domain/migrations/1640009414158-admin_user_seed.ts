import { MigrationInterface, QueryRunner } from "typeorm";
import * as dotenv from "dotenv";
dotenv.config();

export class adminUserSeed1640009414158 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`

        INSERT INTO role(name) VALUES ('SERVICE_TEAM')
        INSERT INTO role(name) VALUES ('MEMBER')
        INSERT INTO role(name) VALUES ('SUPER_ADMIN')

        INSERT INTO user_role(user_id, role_id)
        SELECT u.id, r.id FROM [user] U
        CROSS JOIN role R
        WHERE u.id = '${process.env.ADMIN_OID}' and r.name = 'SUPER_ADMIN'

        INSERT INTO user_role(user_id, role_id)
        SELECT u.id, r.id FROM [user] U
        CROSS JOIN role R
        WHERE u.id = '${process.env.ADMIN_OID}' and r.name = 'SERVICE_TEAM'

        INSERT INTO user_role(user_id, role_id)
        SELECT u.id, r.id FROM [user] U
        CROSS JOIN role R
        WHERE u.id = '${process.env.ADMIN_OID}' and r.name = 'MEMBER'

      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    //
  }
}
