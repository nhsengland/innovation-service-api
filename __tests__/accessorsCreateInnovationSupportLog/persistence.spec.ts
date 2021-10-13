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
       jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      jest.spyOn(typeorm, "getConnection").mockImplementation((connectionName: string) => ({ close: () => { } }) as typeorm.Connection );
      const spy = jest.spyOn(
        InnovationSupportLogService.prototype,
        "create"
      ).mockResolvedValue([{ id: "" }] as any);

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
