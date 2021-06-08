import * as persistence from "../../accessorsGetInnovationSections/persistence";
import {
  InnovationSectionCatalogue,
  InnovationSectionService,
} from "@services/index";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";

describe("[accessorsGetInnovationSection] Persistence suite", () => {
  describe("findInnovationSectionByAccessor", () => {
    it("should assess if an innovation section exists", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationSectionService.prototype,
        "findSection"
      ).and.returnValue([{ section: "SECTION", data: {} }]);

      const ctx = {
        services: {
          InnovationSectionService: new InnovationSectionService(),
        },
        auth: {
          userOrganisations: [],
        },
      };
      // Act
      await persistence.findInnovationSectionByAccessor(
        ctx as CustomContext,
        "test_innovator_id",
        "test_accessor_id",
        InnovationSectionCatalogue.INNOVATION_DESCRIPTION
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
