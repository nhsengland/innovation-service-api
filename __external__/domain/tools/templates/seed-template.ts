/*eslint @typescript-eslint/no-unused-vars: ["off", { "varsIgnorePattern": "[qQ]ueryRunner" }]*/

import { QueryRunner } from "typeorm";

import { BaseSeed } from "../bases/base-seed";

export class __CLASS_NAME__ extends BaseSeed {
  public name = "__TEMPLATE_NAME__";

  public async up(queryRunner: QueryRunner): Promise<any> {
    // const repo = this.getRepository();
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    // const repo = this.getRepository();
  }
}
