import { InnovationService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsGetAllInnovations/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[innovatorsGetAllInnovations] Persistence suite", () => {
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
        "findAllByInnovator"
      ).and.returnValue([{ id: "innovationA" }, { id: "innovationB" }]);

      const ctx = {
        services: {
          InnovationService: new InnovationService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "INNOVATOR",
          },
        },
      };
      // Act
      await persistence.findAllInnovationsByInnovator(ctx as CustomContext);

      expect(spy).toHaveBeenCalled();
    });
  });
});
