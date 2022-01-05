/*eslint @typescript-eslint/no-unused-vars: ["off", { "varsIgnorePattern": "[qQ]ueryRunner" }]*/

import { OrganisationUnit } from "@domain/index";
import { QueryRunner } from "typeorm";

import { BaseSeed } from "../tools/bases/base-seed";

export class alterOrganisationsUnitsNames1640858698485 extends BaseSeed {
  public name = "alterOrganisationsUnitsNames1640858698485";

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

    const orgUnitRepo = this.getRepository(OrganisationUnit);

    // UPDATE Organisation Units Names
    for (let idx = 0; idx < data.length; idx++) {
      const orgUnitObj = data[idx];

      const filterOptions = {
        where: { acronym: orgUnitObj.acronym },
      };
      const orgUnit = await orgUnitRepo.findOne(filterOptions);

      if (!orgUnit) continue;

      orgUnit.name = orgUnitObj.name;
      await orgUnitRepo.save(orgUnit);
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
        name: "Scottish Health Technology Group",
      },
    ];

    const orgUnitRepo = this.getRepository(OrganisationUnit);

    // UPDATE Organisation Units Names
    for (let idx = 0; idx < data.length; idx++) {
      const orgUnitObj = data[idx];

      const filterOptions = {
        where: { acronym: orgUnitObj.acronym },
      };
      const orgUnit = await orgUnitRepo.findOne(filterOptions);

      if (!orgUnit) continue;

      orgUnit.name = orgUnitObj.name;
      await orgUnitRepo.save(orgUnit);
    }
  }
}
