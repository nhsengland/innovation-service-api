import { InnovationTransferService } from "@services/index";
import * as dotenv from "dotenv";
import * as path from "path";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsGetInnovationTransfers/persistence";
import { CustomContext } from "../../utils/types";
describe("[innovatorsGetInnovationTransfers] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("getInnovationTransfers", () => {
    it("should get an innovation transfer", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationTransferService.prototype,
        "findAll"
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
          decodedJwt: {
            oid: ":oid",
          },
        },
      };
      // Act
      await persistence.findInnovationTransfers(ctx as CustomContext);

      expect(spy).toHaveBeenCalled();
    });
  });
});
