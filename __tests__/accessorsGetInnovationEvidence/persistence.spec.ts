import { InnovationEvidenceService, InnovationService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../accessorsGetInnovationEvidence/persistence";
import { CustomContext } from "../../utils/types";

describe("[accessorsGetInnovationEvidence] Persistence suite", () => {
  describe("getInnovationEvidence", () => {
    it("should get an accessors evidence", async () => {
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
    it("should get an accessors innovation", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationService.prototype,
        "findInnovation"
      ).and.returnValue([{ id: "" }]);

      const ctx = {
        services: {
          InnovationService: new InnovationService(),
        },
        auth: {
          userOrganisations: [],
        },
      };
      // Act
      await persistence.findInnovationByAccessorId(
        ctx as CustomContext,
        "E362433E-F36B-1410-80DE-0032FE5B194B",
        "T231433E-F36B-1410-80DE-0032FE5B195B"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
