import * as persistence from "../../innovatorsGetInnovationSectionSummary/persistence";
import { InnovationSectionService } from "@services/index";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";

describe("[innovatorsGetInnovation] Persistence suite", () => {
  describe("findAllInnovationsByInnovator", () => {
    it("should assess if an Innovator exists", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationSectionService.prototype,
        "findAllInnovationSectionsByInnovator"
      ).and.returnValue({ id: "innovationA" });
      const ctx = {
        services: {
          InnovationSectionService: new InnovationSectionService(),
        },
      };
      // Act
      await persistence.findAllInnovationSectionsByInnovator(
        ctx as CustomContext,
        "test_innovator_id",
        "test_innovation_id"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
