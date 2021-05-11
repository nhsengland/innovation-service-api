import { InnovationEvidenceService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsDeleteInnovationEvidence/persistence";
import { CustomContext } from "../../utils/types";

describe("[innovatorsDeleteInnovationEvidence] Persistence suite", () => {
  describe("deleteInnovationEvidence", () => {
    it("should delete an innovation evidence", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationEvidenceService.prototype,
        "delete"
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
      await persistence.deleteInnovationEvidence(
        ctx as CustomContext,
        "E362433E-F36B-1410-80DE-0032FE5B194B",
        "test_innovator_id"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
