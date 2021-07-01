import { InnovationService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../assessmentsGetInnovation/persistence";
import { CustomContext } from "../../utils/types";

describe("[assessmentsGetInnovation] Persistence suite", () => {
  describe("getInnovation", () => {
    it("should get an innovation assessment", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationService.prototype,
        "getAssessmentInnovationSummary"
      ).and.returnValue([{ id: "" }]);

      const ctx = {
        services: {
          InnovationService: new InnovationService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "ASSESSMENT",
          },
        },
      };
      // Act
      await persistence.getAssessmentInnovationSummary(
        ctx as CustomContext,
        "E362433E-F36B-1410-80DE-0032FE5B194B"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
