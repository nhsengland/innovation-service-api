import { InnovationSuggestionService } from "@services/index";
import * as dotenv from "dotenv";
import * as path from "path";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsGetInnovationSuggestions/persistence";
import { CustomContext } from "../../utils/types";
describe("[innovatorsGetInnovationSuggestions] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("getInnovationSuggestions", () => {
    it("should get innovation suggestions", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation((connectionName: string) => ({ close: () => { } }) as typeorm.Connection );
      const spy = jest.spyOn(
        InnovationSuggestionService.prototype,
        "findAllByInnovation"
      ).mockResolvedValue({ id: "" } as any);

      const ctx = {
        services: {
          InnovationSuggestionService: new InnovationSuggestionService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "INNOVATOR",
          },
        },
      };
      // Act
      await persistence.findAllInnovationSuggestions(
        ctx as CustomContext,
        "T362433E-F36B-1410-80DE-0032FE5B194B"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
