import * as persistence from "../../notificationsDeleteOne/persistence";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
import { InAppNotificationService } from "@services/services/InAppNotification.service";
describe("[notificationsDeleteOne] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });

  describe("notificationsDeleteOne", () => {
    it("should delete a notification", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest
        .spyOn(typeorm, "getConnection")
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .mockImplementation(() => ({ close: () => {} } as typeorm.Connection));
      const spy = jest
        .spyOn(InAppNotificationService.prototype, "deleteNotification")
        .mockResolvedValue({ id: ":test_notification_oid" } as any);

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
      await persistence.deleteNotification(
        ctx as CustomContext,
        ":notificationId"
      );
      //Assert
      expect(spy).toHaveBeenCalled();
    });
  });
});
