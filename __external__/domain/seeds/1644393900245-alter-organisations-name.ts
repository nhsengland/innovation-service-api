/*eslint @typescript-eslint/no-unused-vars: ["off", { "varsIgnorePattern": "[qQ]ueryRunner" }]*/

import { Organisation } from "@domain/index";
import { QueryRunner } from "typeorm";

import { BaseSeed } from "../tools/bases/base-seed";

export class alterOrganisationsName1644393900245 extends BaseSeed {
  public name = "alterOrganisationsName1644393900245";

  public async up(queryRunner: QueryRunner): Promise<any> {
    const data = [
      {
        acronym: "NOCRI/NIHR",
        name: "National Institute for Health Research",
      },
      {
        acronym: "SHTG",
        name: "Scottish Health Technologies Group",
      },
    ];

    const orgRepo = this.getRepository(Organisation);

    // UPDATE Organisation Names
    for (let idx = 0; idx < data.length; idx++) {
      const orgObj = data[idx];

      const filterOptions = {
        where: { acronym: orgObj.acronym },
      };
      const org = await orgRepo.findOne(filterOptions);

      if (!org) continue;

      org.name = orgObj.name;
      await orgRepo.save(org);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    const data = [
      {
        acronym: "NOCRI/NIHR",
        name: "NOCRI/NIHR",
      },
      {
        acronym: "SHTG",
        name: "Scottish Heath Technologies Group",
      },
    ];

    const orgRepo = this.getRepository(Organisation);

    // UPDATE Organisation Names
    for (let idx = 0; idx < data.length; idx++) {
      const orgObj = data[idx];

      const filterOptions = {
        where: { acronym: orgObj.acronym },
      };
      const org = await orgRepo.findOne(filterOptions);

      if (!org) continue;

      org.name = orgObj.name;
      await orgRepo.save(org);
    }
  }
}
