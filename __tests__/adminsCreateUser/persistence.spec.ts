import { UserType } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../adminsCreateUser/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
import { AdminService } from "@services/services/Admin.service";
describe("[adminsCreateUser] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("adminsCreateUser", () => {
    it("should create user", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(AdminService.prototype, "createUser")
        .mockResolvedValue([{ id: "" }] as any);

      const ctx = {
        services: {
          AdminService: new AdminService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "ADMIN",
          },
        },
      };
      // Act
      await persistence.createUser(ctx as CustomContext, {
        email: "email@aaa.com",
        type: UserType.ASSESSMENT,
        name: "Test",
      });

      expect(spy).toHaveBeenCalled();
    });
  });
});
