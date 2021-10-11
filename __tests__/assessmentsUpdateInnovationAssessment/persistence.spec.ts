import { InnovationAssessmentService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../assessmentsUpdateInnovationAssessment/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[assessmentsUpdateInnovationAssessment] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("updateInnovationAssessment", () => {
    it("should update an innovation assessment", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation((connectionName: string) => ({ close: () => { } }) as typeorm.Connection );
      const spy = jest.spyOn(
        InnovationAssessmentService.prototype,
        "update"
      ).mockResolvedValue([{ id: "" }] as any);

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
      await persistence.updateInnovationAssessment(
        ctx as CustomContext,
        "id",
        "test_innovation_id",
        {
          description: "test",
        }
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
