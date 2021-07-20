/*eslint @typescript-eslint/no-unused-vars: ["off", { "varsIgnorePattern": "[qQ]ueryRunner" }]*/

import { OrganisationUnit } from "@domain/index";
import { QueryRunner } from "typeorm";

import { BaseSeed } from "../tools/bases/base-seed";

export class alterOrganisationUnitIsShadow1626707748930 extends BaseSeed {
  public name = "alterOrganisationUnitIsShadow1626707748930";

  public async up(queryRunner: QueryRunner): Promise<any> {
    const data = [
      {
        acronym: "NOCRI/NIHR",
        isShadow: true,
      },
      {
        acronym: "NHS-SC",
        isShadow: true,
      },
      {
        acronym: "NICE",
        isShadow: true,
      },
      {
        acronym: "SHTG",
        isShadow: true,
      },
      {
        acronym: "NHSE-SC",
        isShadow: true,
      },
      {
        acronym: "LSHW",
        isShadow: true,
      },
      {
        acronym: "DIT",
        isShadow: true,
      },
      {
        acronym: "HTW",
        isShadow: true,
      },
    ];

    const orgUnitRepo = this.getRepository(OrganisationUnit);

    for (let idx = 0; idx < data.length; idx++) {
      const orgUnitObj = data[idx];

      const filterOptions = {
        where: { acronym: orgUnitObj.acronym },
      };
      const orgUnit = await orgUnitRepo.findOne(filterOptions);

      if (!orgUnit) continue;

      orgUnit.isShadow = true;
      await orgUnitRepo.save(orgUnit);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    // const repo = this.getRepository();
  }
}
