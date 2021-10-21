import { InnovationSupportLogService } from "@services/index";
import * as dotenv from "dotenv";
import * as path from "path";
import * as typeorm from "typeorm";
import * as persistence from "../../assessmentsGetInnovationSupportLogs/persistence";
import { CustomContext } from "../../utils/types";

describe("[assessmentsGetInnovationSupportLogs] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("getInnovationSupportLogs", () => {
    it("should get an innovation support", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(InnovationSupportLogService.prototype, "findAllByInnovation")
        .mockResolvedValue([{ id: "" }] as any);

      const ctx = {
        services: {
          InnovationSupportLogService: new InnovationSupportLogService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "ASSESSMENT",
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
