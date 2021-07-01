import { InnovationActionService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsGetInnovationAction/persistence";
import { CustomContext } from "../../utils/types";

describe("[innovatorsGetInnovationAction] Persistence suite", () => {
  describe("findInnovationAction", () => {
    it("should assess if an innovation action exists", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationActionService.prototype,
        "find"
      ).and.returnValue([{ id: ":action_id" }]);

      const ctx = {
        services: {
          InnovationActionService: new InnovationActionService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "INNOVATOR",
          },
        },
      };
      // Act
      await persistence.findInnovationAction(
        ctx as CustomContext,
        ":action_id",
        ":innovation_id"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
