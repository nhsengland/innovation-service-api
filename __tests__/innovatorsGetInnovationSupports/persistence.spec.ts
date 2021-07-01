import { InnovationSupportService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsGetInnovationSupports/persistence";
import { CustomContext } from "../../utils/types";

describe("[innovatorsGetInnovationSupports] Persistence suite", () => {
  describe("getInnovationSupports", () => {
    it("should get all innovation supports", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationSupportService.prototype,
        "findAllByInnovation"
      ).and.returnValue([{ id: "" }]);

      const ctx = {
        services: {
          InnovationSupportService: new InnovationSupportService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "INNOVATOR",
          },
        },
      };
      // Act
      await persistence.findAllInnovationSupports(
        ctx as CustomContext,
        "E362433E-F36B-1410-80DE-0032FE5B194B"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
