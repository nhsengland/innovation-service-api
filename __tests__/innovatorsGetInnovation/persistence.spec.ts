import { InnovationService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsGetInnovation/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[innovatorsGetInnovation] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("findAllInnovationsByInnovator", () => {
    it("should assess if an Innovator exists", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      jest.spyOn(typeorm, "getConnection").mockImplementation((connectionName: string) => ({ close: () => { } }) as typeorm.Connection );
      const spy = jest.spyOn(
        InnovationService.prototype,
        "getInnovationOverview"
      ).mockResolvedValue({ id: "innovationA" } as any);
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
      await persistence.findInnovationsByInnovator(
        ctx as CustomContext,
        "test_innovation_id"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
