import { InnovationService } from "@services/index";
import * as dotenv from "dotenv";
import * as path from "path";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsArchiveInnovation/persistence";
import { CustomContext } from "../../utils/types";
describe("[innovatorsArchiveInnovation] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("ArchiveInnovation", () => {
    it("should archive an innovation", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(InnovationService.prototype, "archiveInnovation")
        .mockResolvedValue([] as any);

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
      await persistence.archiveInnovation(
        ctx as CustomContext,
        "E362433E-F36B-1410-80DE-0032FE5B194B",
        ":reason"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
