import { InnovationAssessmentService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../assessmentsCreateInnovationAssessment/persistence";
import { CustomContext } from "../../utils/types";

describe("[assessmentsCreateInnovationAssessment] Persistence suite", () => {
  describe("createInnovationAssessment", () => {
    it("should create an innovation assessment", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationAssessmentService.prototype,
        "create"
      ).and.returnValue([{ id: "" }]);

      const ctx = {
        services: {
          InnovationAssessmentService: new InnovationAssessmentService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "ASSESSMENT",
          },
        },
      };
      // Act
      await persistence.createInnovationAssessment(
        ctx as CustomContext,
        "test_innovation_id",
        {
          innovation: "innovation_id",
          assignTo: "test_assessment_user_id",
        }
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
