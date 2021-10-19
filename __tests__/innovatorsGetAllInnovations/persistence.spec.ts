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
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(InnovationService.prototype, "findAllByInnovator")
        .mockResolvedValue([
          { id: "innovationA" },
          { id: "innovationB" },
        ] as any);

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
