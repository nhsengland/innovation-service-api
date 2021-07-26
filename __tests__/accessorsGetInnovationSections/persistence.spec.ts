import * as persistence from "../../accessorsGetInnovationSections/persistence";
import {
  InnovationSectionCatalogue,
  InnovationSectionService,
} from "@services/index";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[accessorsGetInnovationSection] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("findInnovationSectionByAccessor", () => {
    it("should assess if an innovation section exists", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationSectionService.prototype,
        "findSection"
      ).and.returnValue([{ section: "SECTION", data: {} }]);

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
      await persistence.findInnovationSectionByAccessor(
        ctx as CustomContext,
        "test_innovation_id",
        InnovationSectionCatalogue.INNOVATION_DESCRIPTION
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
