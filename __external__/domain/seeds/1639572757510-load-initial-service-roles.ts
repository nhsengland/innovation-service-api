/*eslint @typescript-eslint/no-unused-vars: ["off", { "varsIgnorePattern": "[qQ]ueryRunner" }]*/

import { Role, UserRole, User, UserType } from "@domain/index";
import { QueryRunner } from "typeorm";

import { BaseSeed } from "../tools/bases/base-seed";

export class loadInitialServiceRoles1639572757510 extends BaseSeed {
  public name = "loadInitialServiceRoles1639572757510";

  public async up(queryRunner: QueryRunner): Promise<any> {
    const adminUserId = process.env.ADMIN_OID;
    const userRepo = this.getRepository(User);
    const userRoleRepo = this.getRepository(UserRole);
    const roleRepo = this.getRepository(Role);

    // Add admin user
    const userObj = User.new({
      id: adminUserId,
      type: UserType.ADMIN,
      createdBy: "seed",
      updatedBy: "seed",
    });

    await userRepo.save(userObj);

    // Seed roles
    const roles = [
      {
        name: "ADMIN",
      },
      {
        name: "SERVICE_TEAM",
      },
    ];

    for (let roleIdx = 0; roleIdx < roles.length; roleIdx++) {
      const curr = roles[roleIdx];

      const roleObj = Role.new({
        name: curr.name,
        createdBy: "seed",
        updatedBy: "seed",
      });

      await roleRepo.save(roleObj);
    }

    // Assign service roles to Admin User
    const userRoles = await userRoleRepo.find();

    for (let roleIdx = 0; roleIdx < userRoles.length; roleIdx++) {
      const curr = userRoles[roleIdx];

      const srObj = UserRole.new({
        user: adminUserId,
        role: curr.id,
        createdBy: "seed",
        updatedBy: "seed",
      });

      await userRoleRepo.save(srObj);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    const query = this.getConnection().createQueryBuilder().delete();

    await query.from(UserRole).execute();
    await query.from(Role).execute();
  }
}
