import * as persistence from "../../accessorsGetInnovationSectionSummary/persistence";
import { InnovationSectionService } from "@services/index";
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
  describe("findAllInnovationsSections", () => {
    it("should assess if an innovation exists", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationSectionService.prototype,
        "findAllInnovationSectionsMetadata"
      ).and.returnValue({ id: "innovationA" });
      const ctx = {
        services: {
          InnovationSectionService: new InnovationSectionService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "ACCESSOR",
          },
        },
      };
      // Act
      await persistence.findAllInnovationSectionsMetadata(
        ctx as CustomContext,
        "test_innovation_id"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
