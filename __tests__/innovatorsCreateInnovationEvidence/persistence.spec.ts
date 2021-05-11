import {
  InnovationEvidenceService,
  InnovationSectionCatalogue,
} from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsCreateInnovationEvidence/persistence";
import { CustomContext } from "../../utils/types";

describe("[innovatorsCreateInnovationEvidence] Persistence suite", () => {
  describe("createInnovationEvidence", () => {
    it("should create an innovation evidence", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationEvidenceService.prototype,
        "create"
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
      await persistence.createInnovationEvidence(
        ctx as CustomContext,
        "test_innovator_id",
        {
          evidenceType: "CLINICAL",
          clinicalEvidenceType: "DATA_PUBLISHED",
          description: "",
          summary: "",
          files: [],
        },
        InnovationSectionCatalogue.EVIDENCE_OF_EFFECTIVENESS
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
