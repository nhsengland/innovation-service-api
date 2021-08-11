import { InnovationTransferService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsUpdateInnovationTransfer/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";

describe("[innovatorsUpdateInnovationTransfer] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("updateInnovationTransfer", () => {
    it("should update an innovation transfer", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationTransferService.prototype,
        "updateStatus"
      ).and.returnValue([{ id: "" }]);

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
      await persistence.updateInnovationTransfer(
        ctx as CustomContext,
        ":transferId",
        ":status"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
