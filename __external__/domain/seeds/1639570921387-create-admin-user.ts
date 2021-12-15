/*eslint @typescript-eslint/no-unused-vars: ["off", { "varsIgnorePattern": "[qQ]ueryRunner" }]*/

import { User, UserType } from "@domain/index";
import { QueryRunner } from "typeorm";

import { BaseSeed } from "../tools/bases/base-seed";

export class createAdminUser1639570921387 extends BaseSeed {
  public name = "createAdminUser1639570921387";

  public async up(queryRunner: QueryRunner): Promise<any> {
    const adminUserId = process.env.ADMIN_OID;
    const userRepo = this.getRepository(User);

    const userObj = User.new({
      id: adminUserId,
      type: UserType.ADMIN,
      createdBy: "seed",
      updatedBy: "seed",
    });

    await userRepo.save(userObj);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    // const repo = this.getRepository();
  }
}
