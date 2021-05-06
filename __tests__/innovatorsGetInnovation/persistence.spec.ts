import * as persistence from "../../innovatorsGetInnovation/persistence";
import { InnovationService } from "@services/index";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";

describe("[innovatorsGetInnovation] Persistence suite", () => {
  describe("findAllInnovationsByInnovator", () => {
    it("should assess if an Innovator exists", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationService.prototype,
        "getInnovationOverview"
      ).and.returnValue({ id: "innovationA" });
      const ctx = {
        services: {
          InnovationService: new InnovationService(),
        },
      };
      // Act
      await persistence.findInnovationsByInnovator(
        ctx as CustomContext,
        "test_innovator_id",
        "test_innovation_id"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
