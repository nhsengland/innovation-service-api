import { InnovationSupportLogService } from "@services/index";
import * as dotenv from "dotenv";
import * as path from "path";
import * as typeorm from "typeorm";
import * as persistence from "../../accessorsGetInnovationSupportLogs/persistence";
import { CustomContext } from "../../utils/types";

describe("[accessorsGetInnovationSupportLogs] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("getInnovationSupportLogs", () => {
    it("should get an innovation support", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationSupportLogService.prototype,
        "findAllByInnovation"
      ).and.returnValue([{ id: "" }]);

      const ctx = {
        services: {
          InnovationSupportLogService: new InnovationSupportLogService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "ACCESSOR",
          },
        },
      };
      // Act
      await persistence.findAllInnovationSupportLogs(
        ctx as CustomContext,
        "E362433E-F36B-1410-80DE-0032FE5B194B"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
