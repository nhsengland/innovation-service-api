import * as persistence from "../../innovatorsGetInnovationSections/persistence";
import {
  InnovationSectionCatalogue,
  InnovationSectionService,
} from "@services/index";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";

describe("[innovatorsGetInnovationSection] Persistence suite", () => {
  describe("findInnovationSectionByInnovator", () => {
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
      await persistence.findInnovationSectionByInnovator(
        ctx as CustomContext,
        "test_innovator_id",
        InnovationSectionCatalogue.INNOVATION_DESCRIPTION
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
