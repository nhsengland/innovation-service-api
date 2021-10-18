import { InnovationEvidenceService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsDeleteInnovationEvidence/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[innovatorsDeleteInnovationEvidence] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("deleteInnovationEvidence", () => {
    it("should delete an innovation evidence", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(InnovationEvidenceService.prototype, "delete")
        .mockResolvedValue([{ id: "" }] as any);

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
      await persistence.deleteInnovationEvidence(
        ctx as CustomContext,
        "E362433E-F36B-1410-80DE-0032FE5B194B"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
