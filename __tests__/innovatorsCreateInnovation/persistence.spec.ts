import { InnovationService } from "@services/index";
import * as dotenv from "dotenv";
import * as path from "path";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsCreateInnovation/persistence";
import { CustomContext } from "../../utils/types";

describe("[innovatorsCreateInnovation] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("createInnovation", () => {
    it("should create an innovation", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationService.prototype,
        "createInnovation"
      ).and.returnValue([{ id: "" }]);

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
      await persistence.createInnovation(
        ctx as CustomContext,
        ":innovation_name",
        ":innovation_desc",
        "England",
        []
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
