import { AdminService } from "@services/services/Admin.service";
import * as dotenv from "dotenv";
import * as path from "path";
import * as typeorm from "typeorm";
import * as persistence from "../../adminsDeleteAdmin/persistence";
import { CustomContext } from "../../utils/types";

describe("[adminsDeleteAdmin] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("adminsDeleteAdmin", () => {
    it("should delete admin user ", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(AdminService.prototype, "deleteAdminAccount")
        .mockResolvedValue([{}] as any);

      const ctx = {
        services: {
          AdminService: new AdminService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
          },
        },
      };
      // Act
      await persistence.deleteAdminAccount(
        ctx as CustomContext,
        "userId",
        "userEmail"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
