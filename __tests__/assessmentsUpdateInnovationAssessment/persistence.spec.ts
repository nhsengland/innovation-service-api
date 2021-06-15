import { InnovationAssessmentService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../assessmentsUpdateInnovationAssessment/persistence";
import { CustomContext } from "../../utils/types";

describe("[assessmentsUpdateInnovationAssessment] Persistence suite", () => {
  describe("updateInnovationAssessment", () => {
    it("should update an innovation assessment", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationAssessmentService.prototype,
        "update"
      ).and.returnValue([{ id: "" }]);

      const ctx = {
        services: {
          InnovationAssessmentService: new InnovationAssessmentService(),
        },
      };
      // Act
      await persistence.updateInnovationAssessment(
        ctx as CustomContext,
        "id",
        "test_assessment_user_id",
        "test_innovation_id",
        {
          description: "test",
        }
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});