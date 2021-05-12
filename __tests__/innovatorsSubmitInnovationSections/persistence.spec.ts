import * as persistence from "../../innovatorsSubmitInnovationSections/persistence";
import {
  InnovationSectionCatalogue,
  InnovationSectionService,
} from "@services/index";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";

describe("[innovatorsSubmitInnovationSection] Persistence suite", () => {
  describe("submitInnovationSection", () => {
    it("should submit an innovation section", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationSectionService.prototype,
        "submitSections"
      ).and.returnValue([]);

      const ctx = {
        services: {
          InnovationSectionService: new InnovationSectionService(),
        },
        auth: {
          userOrganisations: [],
        },
      };
      // Act
      await persistence.submitInnovationSections(
        ctx as CustomContext,
        "E362433E-F36B-1410-80DE-0032FE5B194B",
        "test_innovator_id",
        [InnovationSectionCatalogue.INNOVATION_DESCRIPTION]
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
