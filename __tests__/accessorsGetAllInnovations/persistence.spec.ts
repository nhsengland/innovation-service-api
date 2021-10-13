import * as persistence from "../../accessorsGetAllInnovations/persistence";
import { InnovationService } from "@services/index";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[accessorsGetAllInnovations] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("findAllInnovationsByAccessor", () => {
    it("should assess if an Accessor exists", async () => {
      // Arrange
       jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      jest.spyOn(typeorm, "getConnection").mockImplementation((connectionName: string) => ({ close: () => { } }) as typeorm.Connection );
      const spy = jest.spyOn(
        InnovationService.prototype,
        "findAllByAccessorAndSupportStatus"
      ).mockResolvedValue([{ id: "innovationA" }, { id: "innovationB" }] as any);

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
      await persistence.findAllInnovationsByAccessor(
        ctx as CustomContext,
        "ENGAGING",
        true,
        false,
        0,
        10
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
