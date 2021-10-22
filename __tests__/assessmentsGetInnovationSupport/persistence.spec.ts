import { InnovationSupportService, InnovationService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../assessmentsGetInnovationSupport/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[assessmentsGetInnovationSupport] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("getInnovationSupport", () => {
    it("should get an innovation support", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(InnovationSupportService.prototype, "find")
        .mockResolvedValue([{ id: "" }] as any);

      const ctx = {
        services: {
          InnovationSupportService: new InnovationSupportService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "ASSESSMENT",
          },
        },
      };
      // Act
      await persistence.findInnovationSupport(
        ctx as CustomContext,
        "95773C68-AE30-EC11-981F-281878026472",
        "4D400EB3-AD30-EC11-981F-281878026472"
        // "E362433E-F36B-1410-80DE-0032FE5B194B",
        // "F362433E-F36B-1410-80DE-0032FE5B194B"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
