import { ActivityLogService, InnovationService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsGetInnovationActivities/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[innovatorsGetInnovationActivities] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("getInnovationActivitiesById", () => {
    it("should assess if an Innovator exists", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spyInnvotion = jest
        .spyOn(InnovationService.prototype, "findInnovation")
        .mockResolvedValue({
          id: "InnovationA",
        } as any);

      const spyActivityLog = jest
        .spyOn(ActivityLogService.prototype, "getInnovationActivitiesById")
        .mockResolvedValue([{ id: "ActivityA" }, { id: "ActivityB" }] as any);

      const ctx = {
        services: {
          InnovationService: new InnovationService(),
          ActivityLogService: new ActivityLogService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "INNOVATOR",
          },
        },
      };
      // Act
      await persistence.getInnovationActivitiesById(
        ctx as CustomContext,
        ":innovation_id",
        10,
        0,
        ":activityTypes"
      );

      expect(spyActivityLog).toHaveBeenCalled();
    });
  });
});
