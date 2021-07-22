import { InnovatorService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsHeadOne/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[innovatorsHeadOne] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("headInnovator", () => {
    it("should assess if an Innovator exists", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(InnovatorService.prototype, "find").and.returnValue([
        { innovator: "" },
      ]);

      const ctx = {
        services: {
          InnovatorService: new InnovatorService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "INNOVATOR",
          },
        },
      };
      // Act
      await persistence.findInnovatorById(
        ctx as CustomContext,
        "test_innovator_oid"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
