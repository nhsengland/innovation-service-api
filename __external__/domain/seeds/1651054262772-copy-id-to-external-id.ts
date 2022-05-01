/*eslint @typescript-eslint/no-unused-vars: ["off", { "varsIgnorePattern": "[qQ]ueryRunner" }]*/

import { User } from "@domain/index";
import { QueryRunner } from "typeorm";

import { BaseSeed } from "../tools/bases/base-seed";

export class copyIdToExternalId1651054262772 extends BaseSeed {
  public name = "copyIdToExternalId1651054262772";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `
        update u set u.external_id = u2.id
        FROM [user] u
        inner join [user] u2
        on u.id = u2.id
        where u.id != u2.external_id
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
