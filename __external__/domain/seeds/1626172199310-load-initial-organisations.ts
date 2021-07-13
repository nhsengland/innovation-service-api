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
        name: "Organisation Test",
        acronym: "OTT",
        units: [
          {
            name: "Unit A",
            acronym: "UTA",
          },
          {
            name: "Unit B",
            acronym: "UTB",
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
