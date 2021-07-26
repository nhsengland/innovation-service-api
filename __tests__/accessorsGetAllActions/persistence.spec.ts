import { InnovationActionService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../accessorsGetAllActions/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[accessorsGetAllActions] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("findAllActions", () => {
    it("should assess all innovation actions", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationActionService.prototype,
        "findAllByAccessor"
      ).and.returnValue({ count: 1, data: [{ id: ":id" }] });

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
      await persistence.findAllActions(ctx as CustomContext, true, 0, 10);

      expect(spy).toHaveBeenCalled();
    });
  });
});
