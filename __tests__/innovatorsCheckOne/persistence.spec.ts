import { InnovationTransferService } from "@services/index";
import * as dotenv from "dotenv";
import * as path from "path";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsCheckOne/persistence";
import { CustomContext } from "../../utils/types";
describe("[innovatorsCheckOne] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("checkInnovationTransfer", () => {
    it("should check an innovator transfers", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(InnovationTransferService.prototype, "checkUserPendingTransfers")
        .mockResolvedValue([{ hasInvites: true, userExists: true }] as any);

      const ctx = {
        services: {
          InnovationTransferService: new InnovationTransferService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "INNOVATOR",
          },
        },
      };
      // Act
      await persistence.checkUserPendingTransfers(
        ctx as CustomContext,
        "E362433E-F36B-1410-80DE-0032FE5B194B"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
