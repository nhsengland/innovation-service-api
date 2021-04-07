import * as persistence from "../../innovatorsGetInnovation/persistence";
import { InnovationService } from "nhs-aac-domain-services";
import * as typeorm from "typeorm";

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

      // Act
      await persistence.findInnovationsByInnovator(
        "test_innovator_id",
        "test_innovation_id"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
