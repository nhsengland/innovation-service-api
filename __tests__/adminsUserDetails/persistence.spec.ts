import * as typeorm from "typeorm";
import * as persistence from "../../adminsUserDetails/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
import { AdminService } from "@services/services/Admin.service";
import { UserService } from "@services/index";
describe("[adminsUserDetails] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("adminsUserDetails", () => {
    it("should get user details", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(AdminService.prototype, "getUserDetails")
        .mockResolvedValue({
          id: ":userId",
          name: ":userName",
        } as any);

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

      jest.spyOn(UserService.prototype, "getUser").mockResolvedValue({
        id: ":userId",
        externalId: ":userId",
      } as any);
      // Act
      await persistence.getUser(ctx as CustomContext, "test", "MINIMAL");

      expect(spy).toHaveBeenCalled();
    });
  });
});
