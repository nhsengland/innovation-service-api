import { InnovationSupportLogService } from "@services/index";
import * as dotenv from "dotenv";
import * as path from "path";
import * as typeorm from "typeorm";
import * as persistence from "../../accessorsCreateInnovationSupportLog/persistence";
import { CustomContext } from "../../utils/types";

describe("[accessorsCreateInnovationSupportLog] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("createInnovationSupportLog", () => {
    it("should create an innovation support log", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationSupportLogService.prototype,
        "create"
      ).and.returnValue([{ id: "" }]);

      const ctx = {
        services: {
          InnovationSupportLogService: new InnovationSupportLogService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "QUALIFYING_ACCESSOR",
          },
        },
      };
      // Act
      await persistence.createInnovationSupportLog(
        ctx as CustomContext,
        "E362433E-F36B-1410-80DE-0032FE5B194B",
        {
          type: "ACCESSOR_SUGGESTION",
          description: ":description",
          organisationUnits: [
            "AB70433E-F36B-1410-8111-0032FE5B194B",
            "0571433E-F36B-1410-8111-0032FE5B194B",
          ],
        }
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
