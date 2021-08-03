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
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        NotificationService.prototype,
        "getAllUnreadNotificationsCounts"
      ).and.returnValue({
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
