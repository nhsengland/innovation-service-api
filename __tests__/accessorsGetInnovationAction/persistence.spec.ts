import { InnovationActionService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../accessorsGetInnovationAction/persistence";
import { CustomContext } from "../../utils/types";

describe("[accessorsGetInnovationAction] Persistence suite", () => {
  describe("findInnovationAction", () => {
    it("should assess if an innovation actions exists", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationActionService.prototype,
        "find"
      ).and.returnValue({ id: ":action_id" });

      const ctx = {
        services: {
          InnovationActionService: new InnovationActionService(),
        },
        auth: {
          userOrganisations: [],
        },
      };
      // Act
      await persistence.findInnovationAction(
        ctx as CustomContext,
        ":action_id",
        ":innovation_id",
        ":accessor_id"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
