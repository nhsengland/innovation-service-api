import { InnovationActionService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../accessorsGetInnovationActions/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[accessorsGetInnovationActions] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
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
          requestUser: {
            id: ":userId",
            type: "ACCESSOR",
          },
        },
      };
      // Act
      await persistence.findInnovationActions(
        ctx as CustomContext,
        ":innovation_id"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
