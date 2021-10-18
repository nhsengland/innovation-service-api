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
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(NotificationService.prototype, "dismiss")
        .mockResolvedValue({} as any);

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
