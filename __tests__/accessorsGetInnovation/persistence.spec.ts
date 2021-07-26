import * as persistence from "../../accessorsGetInnovation/persistence";
import { InnovationService } from "@services/index";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[accessorsGetInnovation] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("findAllInnovationsByInnovator", () => {
    it("should assess if an Innovator exists", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationService.prototype,
        "getAccessorInnovationSummary"
      ).and.returnValue({ id: "innovationA" });
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
      await persistence.findInnovationOverview(
        ctx as CustomContext,
        "test_innovation_id"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
