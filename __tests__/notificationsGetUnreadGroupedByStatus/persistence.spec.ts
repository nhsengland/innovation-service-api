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
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        NotificationService.prototype,
        "getNotificationsGroupedBySupportStatus"
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
      await persistence.getNotificationsGroupedByStatus(
        ctx as CustomContext,
        "SUPPORT_STATUS"
      );

      expect(spy).toHaveBeenCalled();
    });

    it("should find all notifications grouped by support status", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        NotificationService.prototype,
        "getNotificationsGroupedByInnovationStatus"
      ).and.returnValue({
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
