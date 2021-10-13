import * as persistence from "../../notificationsGetUnreadGroupedByContextType/persistence";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
import { NotificationService } from "@services/services/Notification.service";
describe("[notificationsGetUnreadGroupedByContext] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("getAllUnreadNotificationsCounts", () => {
    it("should find all notifications grouped by context", async () => {
      // Arrange

       jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      jest.spyOn(typeorm, "getConnection").mockImplementation((connectionName: string) => ({ close: () => { } }) as typeorm.Connection );
      const spy = jest.spyOn(
        NotificationService.prototype,
        "getAllUnreadNotificationsCounts"
      ).mockResolvedValue({
        INNOVATION: 1,
        ACTION: 1,
        DATA_SHARING: 1,
        SUPPORT: 2,
        COMMENT: 4,
      });

      const ctx = {
        auth: {
          requestUser: {
            id: ":userId",
            type: "ACCESSOR",
          },
        },
        services: {
          NotificationService: new NotificationService(),
        },
      };
      // Act
      await persistence.getAllUnreadNotificationsCounts(
        ctx as CustomContext,
        ":innovationId"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
