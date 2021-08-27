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
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationService.prototype,
        "archiveInnovation"
      ).and.returnValue([]);

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
