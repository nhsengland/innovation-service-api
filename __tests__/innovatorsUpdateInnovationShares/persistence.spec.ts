import { InnovationService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsUpdateInnovationShares/persistence";
import { CustomContext } from "../../utils/types";

describe("[innovatorsUpdateInnovationShares] Persistence suite", () => {
  describe("updateInnovationShares", () => {
    it("should update an innovation shares", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationService.prototype,
        "updateOrganisationShares"
      ).and.returnValue({ id: "" });

      const ctx = {
        services: {
          InnovationService: new InnovationService(),
        },
      };
      // Act
      await persistence.updateInnovationShares(
        ctx as CustomContext,
        "T362433E-F36B-1410-80DE-0032FE5B194B",
        "E362433E-F36B-1410-80DE-0032FE5B194B",
        ["F362433E-F36B-1410-80DE-0032FE5B194B"]
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
