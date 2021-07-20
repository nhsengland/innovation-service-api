import { OrganisationService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../organisationUnitsGetAll/persistence";
import { CustomContext } from "../../utils/types";

describe("[organisationUnitsGetAll] Persistence suite", () => {
  describe("findAll", () => {
    it("should find all organisation units", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        OrganisationService.prototype,
        "findAllWithOrganisationUnits"
      ).and.returnValue([
        { id: ":organisation_id", organisationUnits: [{ id: ":unit_id" }] },
      ]);

      const ctx = {
        services: {
          OrganisationService: new OrganisationService(),
        },
      };
      // Act
      await persistence.findAll(ctx as CustomContext);

      expect(spy).toHaveBeenCalled();
    });
  });
});
