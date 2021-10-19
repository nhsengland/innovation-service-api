import { InnovationActionService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsUpdateInnovationAction/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[innovatorsUpdateInnovationAction] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("updateInnovationAction", () => {
    it("should update an innovation action", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(InnovationActionService.prototype, "updateByInnovator")
        .mockResolvedValue([{ id: "" }] as any);

      const ctx = {
        services: {
          InnovationActionService: new InnovationActionService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "INNOVATOR",
          },
        },
      };
      // Act
      await persistence.updateInnovationAction(
        ctx as CustomContext,
        "T362433E-F36B-1410-80DE-0032FE5B194B",
        "E362433E-F36B-1410-80DE-0032FE5B194B",
        {
          status: "DECLINED",
          comment: ":comment",
        }
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
