import * as persistence from "../../notificationsGetInnovation/persistence";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
import { InAppNotificationService } from "@services/services/InAppNotification.service";
describe("[notificationsGetInnovation] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });

  describe("notificationsGetInnovation", () => {
    it("should get notification counts by innovation", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest
        .spyOn(typeorm, "getConnection")
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .mockImplementation(() => ({ close: () => {} } as typeorm.Connection));
      const spy = jest
        .spyOn(
          InAppNotificationService.prototype,
          "getNotificationsByInnovationId"
        )
        .mockResolvedValue({ id: ":test_innovation_oid" } as any);

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
      await persistence.getNotificationsByInnovationId(
        ctx as CustomContext,
        ":innovationId"
      );
      //Assert
      expect(spy).toHaveBeenCalled();
    });
  });
});
