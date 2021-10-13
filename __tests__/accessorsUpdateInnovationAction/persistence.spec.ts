import { InnovationActionService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../accessorsUpdateInnovationAction/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[accessorsUpdateInnovationAction] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("updateInnovationAction", () => {
    it("should update an innovation action", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      jest.spyOn(typeorm, "getConnection").mockImplementation((connectionName: string) => ({ close: () => { } }) as typeorm.Connection );
      const spy = jest.spyOn(
        InnovationActionService.prototype,
        "updateByAccessor"
      ).mockResolvedValue([{ id: "" }] as any);

      const ctx = {
        services: {
          InnovationActionService: new InnovationActionService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "ACCESSOR",
          },
        },
      };
      // Act
      await persistence.updateInnovationAction(
        ctx as CustomContext,
        "T362433E-F36B-1410-80DE-0032FE5B194B",
        "E362433E-F36B-1410-80DE-0032FE5B194B",
        {
          status: "DELETED",
          comment: ":comment",
        }
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
