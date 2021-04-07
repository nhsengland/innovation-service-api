import * as persistence from "../../innovatorsGetAllInnovations/persistence";
import { InnovationService } from "nhs-aac-domain-services";
import * as typeorm from "typeorm";

describe("[innovatorsGetAllInnovations] Persistence suite", () => {
  describe("findAllInnovationsByInnovator", () => {
    it("should assess if an Innovator exists", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationService.prototype,
        "findAllByInnovator"
      ).and.returnValue([{ id: "innovationA" }, { id: "innovationB" }]);

      // Act
      await persistence.findAllInnovationsByInnovator("test_innovator_id");

      expect(spy).toHaveBeenCalled();
    });
  });
});
