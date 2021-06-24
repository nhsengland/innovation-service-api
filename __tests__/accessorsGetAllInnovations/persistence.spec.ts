import * as persistence from "../../accessorsGetAllInnovations/persistence";
import { InnovationService } from "@services/index";
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
        "findAllByAccessorAndSupportStatus"
      ).and.returnValue([{ id: "innovationA" }, { id: "innovationB" }]);

      const ctx = {
        services: {
          InnovationService: new InnovationService(),
        },
        auth: {
          userOrganisations: [],
        },
      };
      // Act
      await persistence.findAllInnovationsByAccessor(
        ctx as CustomContext,
        "test_accessor_id",
        "ENGAGING",
        true,
        0,
        10
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
