import {
  InnovationTransferService,
  InnovationSectionCatalogue,
} from "@services/index";
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
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationTransferService.prototype,
        "create"
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
      await persistence.createInnovationTransfer(
        ctx as CustomContext,
        ":innovationId",
        ":email"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
