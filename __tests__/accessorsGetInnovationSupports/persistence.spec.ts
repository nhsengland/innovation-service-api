import { InnovationSupportService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../accessorsGetInnovationSupports/persistence";
import { CustomContext } from "../../utils/types";

describe("[accessorsGetInnovationSupports] Persistence suite", () => {
  describe("getInnovationSupports", () => {
    it("should get innovation supports", async () => {
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
            type: "ACCESSOR",
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
