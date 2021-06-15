import { InnovationActionService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../accessorsGetInnovationActions/persistence";
import { CustomContext } from "../../utils/types";

describe("[accessorsGetInnovationActions] Persistence suite", () => {
  describe("findInnovationActions", () => {
    it("should assess if innovation actions exists", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationActionService.prototype,
        "findAllByInnovation"
      ).and.returnValue([{ id: ":action_id" }]);

      const ctx = {
        services: {
          InnovationActionService: new InnovationActionService(),
        },
        auth: {
          userOrganisations: [],
        },
      };
      // Act
      await persistence.findInnovationActions(
        ctx as CustomContext,
        ":innovation_id",
        ":accessor_id"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
