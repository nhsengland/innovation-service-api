import * as persistence from "../../notificationsGetCounters/persistence";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
import { InAppNotificationService } from "@services/services/InAppNotification.service";
describe("[notificationsGetCounters] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });

  describe("notificationsGetCounters", () => {
    it("should find all email notification counters for a user", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest
        .spyOn(typeorm, "getConnection")
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .mockImplementation(() => ({ close: () => {} } as typeorm.Connection));
      const spy = jest
        .spyOn(
          InAppNotificationService.prototype,
          "getNotificationCountersByUserId"
        )
        .mockResolvedValue([{}] as any);

      const ctx = {
        auth: {
          requestUser: {
            id: ":userId",
          },
        },
        services: {
          InAppNotificationService: new InAppNotificationService(),
        },
      };
      // Act
      await persistence.getNotificationsCountersByUserId(ctx as CustomContext);
      //Assert
      expect(spy).toHaveBeenCalled();
    });
  });
});
