import { InnovationAssessmentService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../assessmentsGetInnovationAssessment/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[assessmentsGetInnovationAssessment] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("getInnovationAssessment", () => {
    it("should get an innovation assessment", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(InnovationAssessmentService.prototype, "find")
        .mockResolvedValue([{ id: "" }] as any);

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
      await persistence.findInnovationAssessmentById(
        ctx as CustomContext,
        "E362433E-F36B-1410-80DE-0032FE5B194B",
        "T123456E-F88B-6514-89DE-0032FE5B194B"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
