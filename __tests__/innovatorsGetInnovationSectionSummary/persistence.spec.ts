import { InnovationSectionService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsGetInnovationSectionSummary/persistence";
import { CustomContext } from "../../utils/types";

describe("[innovatorsGetInnovation] Persistence suite", () => {
  describe("findAllInnovationSections", () => {
    it("should assess if an innovation exists", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationSectionService.prototype,
        "findAllInnovationSections"
      ).and.returnValue({ id: "innovationA" });
      const ctx = {
        services: {
          InnovationSectionService: new InnovationSectionService(),
        },
      };
      // Act
      await persistence.findAllInnovationSections(
        ctx as CustomContext,
        "test_innovator_id",
        "test_innovation_id"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
