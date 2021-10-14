import * as persistence from "../../notificationsGetEmailTypes/persistence";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
import { NotificationService } from "@services/services/Notification.service";
describe("[notificationsGetEmailTypes] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });

  describe("getEmailNotificationPreferences", () => {
    it("should find all email notification preferences for a user", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        NotificationService.prototype,
        "getEmailNotificationPreferences"
      ).and.returnValue([{ id: "NotificationType", isSubscribed: false }]);

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
      await persistence.getEmailNotificationPreferences(ctx as CustomContext);
      //Assert
      expect(spy).toHaveBeenCalled();
    });
  });
});
