import * as persistence from "../../notificationsUpdatePreference/persistence";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
import { NotificationService } from "@services/services/Notification.service";
import {
  NotificationContextType,
  NotificationPreferenceType,
} from "@domain/index";
describe("[notificationsUpdatePreference] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });

  describe("updateEmailNotificationPreferences", () => {
    it("should update email notification preferences for a user", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest
        .spyOn(typeorm, "getConnection")
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .mockImplementation(() => ({ close: () => {} } as typeorm.Connection));

      const spy = jest
        .spyOn(
          NotificationService.prototype,
          "updateEmailNotificationPreferences"
        )
        .mockResolvedValue([
          { notificationType: NotificationContextType.ACTION, status: "OK" },
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
      await persistence.updateEmailNotificationPreferences(
        ctx as CustomContext,
        [
          {
            notificationType: NotificationContextType.ACTION,
            preference: NotificationPreferenceType.INSTANTLY,
          },
        ]
      );
      //Assert
      expect(spy).toHaveBeenCalled();
    });
  });
});
