import { InnovationSupportService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../accessorsCreateInnovationSupport/persistence";
import { CustomContext } from "../../utils/types";

describe("[accessorsCreateInnovationSupport] Persistence suite", () => {
  describe("createInnovationSupport", () => {
    it("should create an innovation support", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationSupportService.prototype,
        "create"
      ).and.returnValue([{ id: "" }]);

      const ctx = {
        services: {
          InnovationSupportService: new InnovationSupportService(),
        },
        auth: {
          userOrganisations: [],
        },
      };
      // Act
      await persistence.createInnovationSupport(
        ctx as CustomContext,
        "E362433E-F36B-1410-80DE-0032FE5B194B",
        "F362433E-F36B-1410-80DE-0032FE5B194B",
        {
          status: "NOT_YET",
          comment: ":comment",
          accessors: [],
        }
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
