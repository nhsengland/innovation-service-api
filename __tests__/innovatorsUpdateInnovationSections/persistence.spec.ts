import {
  InnovationSectionCatalogue,
  InnovationSectionService,
} from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsUpdateInnovationSections/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[innovatorsUpdateInnovationSection] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("updateInnovationSection", () => {
    it("should update an innovation section", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationSectionService.prototype,
        "saveSection"
      ).and.returnValue([{ section: "SECTION", data: {} }]);

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
      await persistence.updateInnovationSection(
        ctx as CustomContext,
        "E362433E-F36B-1410-80DE-0032FE5B194B",
        InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
        {
          description: "bbb",
          otherCategoryDescription: null,
          hasFinalProduct: null,
          mainPurpose: null,
          categories: [],
          areas: [],
          clinicalAreas: [],
          careSettings: [],
        }
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
