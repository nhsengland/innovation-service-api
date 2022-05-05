/*eslint @typescript-eslint/no-unused-vars: ["off", { "varsIgnorePattern": "[qQ]ueryRunner" }]*/

import { User } from "@domain/index";
import { QueryRunner } from "typeorm";

import { BaseSeed } from "../tools/bases/base-seed";

export class copyIdToExternalId1651054262772 extends BaseSeed {
  public name = "copyIdToExternalId1651054262772";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `
        update [user] set external_id = id
      `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    const repo = this.getRepository(User);
    await repo
      .createQueryBuilder()
      .update()
      .set({ externalId: null })
      .execute();
  }
}
