import { InnovationSectionService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsGetInnovationSectionSummary/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[innovatorsGetInnovation] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("findAllInnovationSections", () => {
    it("should assess if an innovation exists", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationSectionService.prototype,
        "findAllInnovationSections"
      ).and.returnValue({ id: "innovationA" });
      const ctx = {
        services: {
          InnovationSectionService: new InnovationSectionService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "INNOVATOR",
          },
        },
      };
      // Act
      await persistence.findAllInnovationSections(
        ctx as CustomContext,
        "test_innovation_id"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
