import * as persistence from "../../notificationsGetEmailTypes/persistence";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
import { NotificationService } from "@services/services/Notification.service";
import { NotificationPreferenceType } from "@domain/index";
describe("[notificationsGetEmailTypes] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });

  describe("getEmailNotificationPreferences", () => {
    it("should find all email notification preferences for a user", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest
        .spyOn(typeorm, "getConnection")
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .mockImplementation(() => ({ close: () => {} } as typeorm.Connection));
      const spy = jest
        .spyOn(NotificationService.prototype, "getEmailNotificationPreferences")
        .mockResolvedValue([
          {
            id: "NotificationType",
            preference: NotificationPreferenceType.INSTANTLY,
          },
        ]);

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
