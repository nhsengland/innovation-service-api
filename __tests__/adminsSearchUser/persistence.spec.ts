import { UserService, UserType } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../adminsSearchUser/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[adminsSearchUser] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("adminsSearchUser", () => {
    it("should search user", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(UserService.prototype, "searchUser")
        .mockResolvedValue([{ id: "" }] as any);

      const ctx = {
        services: {
          UserService: new UserService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "ADMIN",
          },
        },
      };
      // Act
      await persistence.searchUserByEmail(ctx as CustomContext, "email@aaa.com");

      expect(spy).toHaveBeenCalled();
    });
  });
});
