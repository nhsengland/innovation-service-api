import * as persistence from "../../notificationsPatchDismiss/persistence";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
import { NotificationService } from "@services/services/Notification.service";
import { NotificationContextType } from "@domain/index";
describe("[notificationsGetUnreadGroupedByStatus] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("dismissNotifications", () => {
    it("should find all notifications grouped by context", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        NotificationService.prototype,
        "dismiss"
      ).and.returnValue({});

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
      await persistence.patchDismissNotification(
        ctx as CustomContext,
        ":innovationId",
        NotificationContextType.INNOVATION
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
