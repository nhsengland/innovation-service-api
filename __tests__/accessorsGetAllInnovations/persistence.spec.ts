import * as persistence from "../../accessorsGetAllInnovations/persistence";
import { InnovationService } from "@services/index";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[accessorsGetAllInnovations] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
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
          requestUser: {
            id: ":userId",
            type: "ACCESSOR",
          },
        },
      };
      // Act
      await persistence.findAllInnovationsByAccessor(
        ctx as CustomContext,
        "ENGAGING",
        true,
        0,
        10
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
