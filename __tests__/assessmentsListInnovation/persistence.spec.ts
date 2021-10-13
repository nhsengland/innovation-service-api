import { InnovationService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../assessmentsListInnovations/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[assessmentsListInnovation] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });

  describe("getInnovationListByState", () => {
    it("should assess if an innovation section exists", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      jest.spyOn(typeorm, "getConnection").mockImplementation((connectionName: string) => ({ close: () => { } }) as typeorm.Connection );
      const spy = jest.spyOn(
        InnovationService.prototype,
        "getInnovationListByState"
      ).mockResolvedValue([{ id: ":id" }] as any);

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
      await persistence.getInnovationList(ctx as CustomContext, [], 0, 10);

      expect(spy).toHaveBeenCalled();
    });
  });
});
