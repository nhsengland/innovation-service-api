import * as persistence from "../../notificationsGetUnreadGroupedByStatus/persistence";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
import { NotificationService } from "@services/services/Notification.service";
describe("[notificationsGetUnreadGroupedByStatus] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });

  describe("getAllUnreadNotificationsCounts", () => {
    it("should find all notifications grouped by support status", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(
          NotificationService.prototype,
          "getNotificationsGroupedBySupportStatus"
        )
        .mockResolvedValue({
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
      await persistence.getNotificationsGroupedByStatus(
        ctx as CustomContext,
        "SUPPORT_STATUS"
      );

      expect(spy).toHaveBeenCalled();
    });

    it("should find all notifications grouped by support status", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(
          NotificationService.prototype,
          "getNotificationsGroupedByInnovationStatus"
        )
        .mockResolvedValue({
          UNASSIGNED: 1,
          IN_PROGRESS: 2,
        });

      const ctx = {
        auth: {
          requestUser: {
            id: ":userId",
            type: "ASSESSMENT",
          },
        },
        services: {
          NotificationService: new NotificationService(),
        },
      };
      // Act
      await persistence.getNotificationsGroupedByStatus(
        ctx as CustomContext,
        "INNOVATION_STATUS"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
