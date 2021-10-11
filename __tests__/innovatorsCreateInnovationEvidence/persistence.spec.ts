import {
  InnovationEvidenceService,
  InnovationSectionCatalogue,
} from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsCreateInnovationEvidence/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[innovatorsCreateInnovationEvidence] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("createInnovationEvidence", () => {
    it("should create an innovation evidence", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation((connectionName: string) => ({ close: () => { } }) as typeorm.Connection );
      const spy = jest.spyOn(
        InnovationEvidenceService.prototype,
        "create"
      ).mockResolvedValue([{ id: "" }] as any);

      const ctx = {
        services: {
          InnovationEvidenceService: new InnovationEvidenceService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "INNOVATOR",
          },
        },
      };
      // Act
      await persistence.createInnovationEvidence(
        ctx as CustomContext,
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
