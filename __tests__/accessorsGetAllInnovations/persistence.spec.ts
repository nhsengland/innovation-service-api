import * as persistence from "../../accessorsGetAllInnovations/persistence";
import { InnovationService } from "nhs-aac-domain-services";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";

describe("[accessorsGetAllInnovations] Persistence suite", () => {
  describe("findAllInnovationsByAccessor", () => {
    it("should assess if an Accessor exists", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationService.prototype,
        "findAllByAccessor"
      ).and.returnValue([{ id: "innovationA" }, { id: "innovationB" }]);

      const ctx = {
        services: {
          InnovationService: new InnovationService(),
        },
      };
      // Act
      await persistence.findAllInnovationsByAccessor(
        ctx as CustomContext,
        "test_accessor_id",
        {}
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
