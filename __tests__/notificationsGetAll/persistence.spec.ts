import { InAppNotificationService } from "@services/services/InAppNotification.service";
import * as dotenv from "dotenv";
import * as path from "path";
import * as typeorm from "typeorm";
import { PaginationQueryParamsType } from "utils/joi.helper";
import * as persistence from "../../notificationsGetAll/persistence";
import { CustomContext } from "../../utils/types";
describe("[notificationsGetAll] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("notificationsGetAll", () => {
    it("should get all notifications by user id", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(InAppNotificationService.prototype, "getNotificationsByUserId")
        .mockResolvedValue({} as any);

      const ctx = {
        auth: {
          requestUser: {
            id: ":userId",
            type: "INNOVATOR",
          },
        },
        services: {
          InAppNotificationService: new InAppNotificationService(),
        },
      };

      const filters: { [key: string]: any } = {
        contexTypes: [],
      };

      const paginationObj: PaginationQueryParamsType<string> = {
        order: {
          createdAt: "DESC",
        },
        skip: 0,
        take: 20,
      };
      // Act
      await persistence.getNotificationsByUserId(
        ctx as CustomContext,
        filters,
        paginationObj
      );
      expect(spy).toHaveBeenCalled();
    });
  });
});
