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
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationTransferService.prototype,
        "checkUserPendingTransfers"
      ).and.returnValue([{ hasInvites: true, userExists: true }]);

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
