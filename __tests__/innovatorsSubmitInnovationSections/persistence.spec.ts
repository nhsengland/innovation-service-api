import {
  InnovationSectionCatalogue,
  InnovationSectionService,
} from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsSubmitInnovationSections/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[innovatorsSubmitInnovationSection] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("submitInnovationSection", () => {
    it("should submit an innovation section", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      jest.spyOn(typeorm, "getConnection").mockImplementation((connectionName: string) => ({ close: () => { } }) as typeorm.Connection );
      const spy = jest.spyOn(
        InnovationSectionService.prototype,
        "submitSections"
      ).mockResolvedValue([] as any);

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
      await persistence.submitInnovationSections(
        ctx as CustomContext,
        "E362433E-F36B-1410-80DE-0032FE5B194B",
        [InnovationSectionCatalogue.INNOVATION_DESCRIPTION]
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
