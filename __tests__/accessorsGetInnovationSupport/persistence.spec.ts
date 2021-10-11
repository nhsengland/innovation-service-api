import { InnovationSupportService, InnovationService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../accessorsGetInnovationSupport/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[accessorsGetInnovationSupport] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("getInnovationSupport", () => {
    it("should get an innovation support", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation((connectionName: string) => ({ close: () => { } }) as typeorm.Connection );
      const spy = jest.spyOn(
        InnovationSupportService.prototype,
        "find"
      ).mockResolvedValue([{ id: "" }] as any);

      const ctx = {
        services: {
          InnovationSupportService: new InnovationSupportService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "ACCESSOR",
          },
        },
      };
      // Act
      await persistence.findInnovationSupport(
        ctx as CustomContext,
        "E362433E-F36B-1410-80DE-0032FE5B194B",
        "F362433E-F36B-1410-80DE-0032FE5B194B"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
