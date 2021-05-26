import * as persistence from "../../innovatorsSubmitInnovation/persistence";
import { InnovationService } from "@services/index";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";

describe("[innovatorsSubmitInnovation] Persistence suite", () => {
  describe("submitInnovation", () => {
    it("should submit an innovation", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationService.prototype,
        "submitInnovation"
      ).and.returnValue([]);

      const ctx = {
        services: {
          InnovationService: new InnovationService(),
        },
        auth: {
          userOrganisations: [],
        },
      };
      // Act
      await persistence.submitInnovation(
        ctx as CustomContext,
        "E362433E-F36B-1410-80DE-0032FE5B194B",
        "test_innovator_id"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
