import { InnovationTransferService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsCreateInnovationTransfer/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";

describe("[innovatorsCreateInnovationTransfer] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("createInnovationTransfer", () => {
    it("should create an innovation transfer", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(InnovationTransferService.prototype, "create")
        .mockResolvedValue([{ id: "" }] as any);

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
      await persistence.createInnovationTransfer(
        ctx as CustomContext,
        ":innovationId",
        ":email"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
