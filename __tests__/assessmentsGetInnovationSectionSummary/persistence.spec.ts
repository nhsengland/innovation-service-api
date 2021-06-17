import * as persistence from "../../assessmentsGetInnovationSectionSummary/persistence";
import { InnovationSectionService } from "@services/index";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";

describe("[assessmentsGetInnovation] Persistence suite", () => {
  describe("findAllInnovationSections", () => {
    it("should assess if an innovation exists", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationSectionService.prototype,
        "findAllInnovationSectionsByAssessment"
      ).and.returnValue({ id: "innovationA" });
      const ctx = {
        services: {
          InnovationSectionService: new InnovationSectionService(),
        },
      };
      // Act
      await persistence.findAllInnovationSectionsByAssessment(
        ctx as CustomContext,
        "test_assessment_id",
        "test_innovation_id"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
