import { InnovationEvidenceService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsGetInnovationEvidence/persistence";
import { CustomContext } from "../../utils/types";

describe("[innovatorsGetInnovationEvidence] Persistence suite", () => {
  describe("getInnovationEvidence", () => {
    it("should get an innovation evidence", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationEvidenceService.prototype,
        "find"
      ).and.returnValue([{ id: "" }]);

      const ctx = {
        services: {
          InnovationEvidenceService: new InnovationEvidenceService(),
        },
        auth: {
          userOrganisations: [],
        },
      };
      // Act
      await persistence.findInnovationEvidenceById(
        ctx as CustomContext,
        "E362433E-F36B-1410-80DE-0032FE5B194B"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
