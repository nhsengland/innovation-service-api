import * as persistence from "../../notificationsUpdatePreference/persistence";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
import { NotificationService } from "@services/services/Notification.service";
import { NotificationContextType } from "@domain/index";
describe("[notificationsUpdatePreference] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });

  describe("updateEmailNotificationPreferences", () => {
    it("should update email notification preferences for a user", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        NotificationService.prototype,
        "updateEmailNotificationPreferences"
      ).and.returnValue([{ id: "NotificationType", status: "OK" }]);

      const ctx = {
        auth: {
          requestUser: {
            id: ":userId",
          },
        },
        services: {
          NotificationService: new NotificationService(),
        },
      };
      // Act
      await persistence.updateEmailNotificationPreferences(
        ctx as CustomContext,
        [
          {
            notificationType: NotificationContextType.ACTION,
            isSubscribed: true,
          },
        ]
      );
      //Assert
      expect(spy).toHaveBeenCalled();
    });
  });
});
