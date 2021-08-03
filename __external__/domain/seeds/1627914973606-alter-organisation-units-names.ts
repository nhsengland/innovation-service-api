/*eslint @typescript-eslint/no-unused-vars: ["off", { "varsIgnorePattern": "[qQ]ueryRunner" }]*/

import { OrganisationUnit } from "@domain/index";
import { QueryRunner } from "typeorm";

import { BaseSeed } from "../tools/bases/base-seed";

export class alterOrganisationUnitsNames1627914973606 extends BaseSeed {
  public name = "alterOrganisationUnitsNames1627914973606";

  public async up(queryRunner: QueryRunner): Promise<any> {
    const data = [
      {
        acronym: "NENC",
        name: "North East and North Cumbria AHSN",
      },
      {
        acronym: "EMAHSN",
        name: "East Midlands AHSN",
      },
      {
        acronym: "EAST",
        name: "Eastern AHSN",
      },
      {
        acronym: "NWC",
        name: "Innovation Agency (North West Coast AHSN)",
      },
      {
        acronym: "WMAHSN",
        name: "West Midlands AHSN",
      },
      {
        acronym: "WEAHSN",
        name: "West of England AHSN",
      },
      {
        acronym: "HIN",
        name: "Health Innovation Network South London",
      },
      {
        acronym: "Oxford",
        name: "Oxford AHSN",
      },
      {
        acronym: "UCLP",
        name: "UCLPartners",
      },
      {
        acronym: "YHAHSN",
        name: "Yorkshire and Humber AHSN",
      },
      {
        acronym: "HInM",
        name: "Health Innovation Manchester",
      },
      {
        acronym: "KSS",
        name: "Kent Surrey Sussex AHSN",
      },
      {
        acronym: "Wessex",
        name: "Wessex AHSN",
      },
      {
        acronym: "ICHP",
        name: "Imperial College Health Partners",
      },
      {
        acronym: "SWAHSN",
        name: "South West AHSN",
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

    // DELETE WoE Organisation Unit
    const filterOptions = {
      where: { acronym: "WoE" },
    };
    const orgUnit = await orgUnitRepo.findOne(filterOptions);
    await orgUnitRepo.softDelete({ id: orgUnit.id });
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    // const repo = this.getRepository();
  }
}
