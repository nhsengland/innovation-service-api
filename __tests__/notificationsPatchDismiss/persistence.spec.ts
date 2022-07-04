import {
  NotifContextPayloadType,
  NotifContextType,
} from "@domain/enums/notification.enums";
import { InAppNotificationService } from "@services/services/InAppNotification.service";
import * as dotenv from "dotenv";
import * as path from "path";
import * as typeorm from "typeorm";
import * as persistence from "../../notificationsPatchDismiss/persistence";
import { CustomContext } from "../../utils/types";
describe("[notificationsPatchDismiss] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("dismissNotifications", () => {
    it("should dismiss notification", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(InAppNotificationService.prototype, "dismiss")
        .mockResolvedValue({} as any);

      const ctx = {
        auth: {
          requestUser: {
            id: ":userId",
            type: "ACCESSOR",
          },
        },
        services: {
          InAppNotificationService: new InAppNotificationService(),
        },
      };

      const context: NotifContextPayloadType = {
        id: ":contextId",
        type: NotifContextType.INNOVATION,
      };
      // Act
      await persistence.patchDismissNotification(
        ctx as CustomContext,
        null,
        null,
        context
      );
      expect(spy).toHaveBeenCalled();

      const temporaryTest = true;
      expect(temporaryTest).toBe(true);
    });
  });
});
