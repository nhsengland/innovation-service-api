/*eslint @typescript-eslint/no-unused-vars: ["off", { "varsIgnorePattern": "[qQ]ueryRunner" }]*/

import {
  Organisation,
  OrganisationType,
  OrganisationUnit,
} from "@domain/index";
import { QueryRunner } from "typeorm";
import { BaseSeed } from "../tools/bases/base-seed";

export class loadInitialOrganisations1626172199310 extends BaseSeed {
  public name = "loadInitialOrganisations1626172199310";

  public async up(queryRunner: QueryRunner): Promise<any> {
    const data = [
      {
        name: "NOCRI/NIHR",
        acronym: "NOCRI/NIHR",
        units: [
          {
            name: "NOCRI/NIHR",
            acronym: "NOCRI/NIHR",
            isShadow: true,
          },
        ],
      },
      {
        name: "NHS Supply Chain",
        acronym: "NHS-SC",
        units: [
          {
            name: "NHS Supply Chain",
            acronym: "NHS-SC",
            isShadow: true,
          },
        ],
      },
      {
        name: "NICE",
        acronym: "NICE",
        units: [
          {
            name: "NICE",
            acronym: "NICE",
            isShadow: true,
          },
        ],
      },
      {
        name: "Scottish Heath Technology Group",
        acronym: "SHTG",
        units: [
          {
            name: "Scottish Heath Technology Group",
            acronym: "SHTG",
            isShadow: true,
          },
        ],
      },
      {
        name: "NHSE Specialised Commissioning",
        acronym: "NHSE-SC",
        units: [
          {
            name: "NHSE Specialised Commissioning",
            acronym: "NHSE-SC",
            isShadow: true,
          },
        ],
      },
      {
        name: "Life Sciences Hub Wales",
        acronym: "LSHW",
        units: [
          {
            name: "Life Sciences Hub Wales",
            acronym: "LSHW",
            isShadow: true,
          },
        ],
      },
      {
        name: "Department for International Trade",
        acronym: "DIT",
        units: [
          {
            name: "Department for International Trade",
            acronym: "DIT",
            isShadow: true,
          },
        ],
      },
      {
        name: "Health Technology Wales",
        acronym: "HTW",
        units: [
          {
            name: "Health Technology Wales",
            acronym: "HTW",
            isShadow: true,
          },
        ],
      },
      {
        name: "MHRA",
        acronym: "MHRA",
        units: [
          {
            name: "Devices Regulatory Group",
            acronym: "DRG",
          },
          {
            name: "Devices Information & Operations Group",
            acronym: "DIOG",
          },
          {
            name: "Devices Safety & Surveillance Group",
            acronym: "DSSG",
          },
          {
            name: "Software Group",
            acronym: "SG",
          },
        ],
      },
      {
        name: "AHSN Network",
        acronym: "AHSN",
        units: [
          {
            name: "NENC",
            acronym: "NENC",
          },
          {
            name: "EMAHSN",
            acronym: "EMAHSN",
          },
          {
            name: "West of England",
            acronym: "WoE",
          },
          {
            name: "Eastern",
            acronym: "EAST",
          },
          {
            name: "NWC",
            acronym: "NWC",
          },
          {
            name: "WMAHSN",
            acronym: "WMAHSN",
          },
          {
            name: "WEAHSN",
            acronym: "WEAHSN",
          },
          {
            name: "HIN",
            acronym: "HIN",
          },
          {
            name: "Oxford",
            acronym: "Oxford",
          },
          {
            name: "UCLP",
            acronym: "UCLP",
          },
          {
            name: "YHAHSN",
            acronym: "YHAHSN",
          },
          {
            name: "HInM",
            acronym: "HInM",
          },
          {
            name: "KSS",
            acronym: "KSS",
          },
          {
            name: "Wessex",
            acronym: "Wessex",
          },
          {
            name: "ICHP",
            acronym: "ICHP",
          },
          {
            name: "SWAHSN",
            acronym: "SWAHSN",
          },
        ],
      },
    ];

    const orgRepo = this.getRepository(Organisation);
    const orgUnitRepo = this.getRepository(OrganisationUnit);

    for (let orgIdx = 0; orgIdx < data.length; orgIdx++) {
      const curr = data[orgIdx];

      const orgObj = Organisation.new({
        name: curr.name,
        acronym: curr.acronym,
        type: OrganisationType.ACCESSOR,
        createdBy: "seed",
        updatedBy: "seed",
      });

      const organisation = await orgRepo.save(orgObj);

      for (let orgUnitIdx = 0; orgUnitIdx < curr.units.length; orgUnitIdx++) {
        const currUnit = curr.units[orgUnitIdx];

        const orgUnitObj = OrganisationUnit.new({
          name: currUnit.name,
          acronym: currUnit.acronym,
          organisation,
          createdBy: "seed",
          updatedBy: "seed",
        });

        await orgUnitRepo.save(orgUnitObj);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    const query = this.getConnection().createQueryBuilder().delete();

    await query.from(OrganisationUnit).execute();
    await query.from(Organisation).execute();
  }
}
