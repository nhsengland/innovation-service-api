import * as persistence from "../../innovatorsGetAllInnovations/persistence";
import { InnovationService } from "@services/index";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";

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

      const ctx = {
        services: {
          InnovationService: new InnovationService(),
        },
      };
      // Act
      await persistence.findAllInnovationsByInnovator(
        ctx as CustomContext,
        "test_innovator_id"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
