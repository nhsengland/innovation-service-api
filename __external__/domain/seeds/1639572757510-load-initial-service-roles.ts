/*eslint @typescript-eslint/no-unused-vars: ["off", { "varsIgnorePattern": "[qQ]ueryRunner" }]*/

import { Role } from "@domain/index";
import { QueryRunner } from "typeorm";

import { BaseSeed } from "../tools/bases/base-seed";

export class loadInitialServiceRoles1639572757510 extends BaseSeed {
  public name = "loadInitialServiceRoles1639572757510";

  public async up(queryRunner: QueryRunner): Promise<any> {
    const roleRepo = this.getRepository(Role);

    // Seed roles
    const roles = [
      {
        name: "Super Admin",
      },
      {
        name: "Admin",
      },
      {
        name: "Service Team",
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
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    const query = this.getConnection().createQueryBuilder().delete();

    await query.from(Role).execute();
  }
}
