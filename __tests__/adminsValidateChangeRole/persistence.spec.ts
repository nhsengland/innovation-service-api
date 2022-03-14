import { UserService } from "@services/index";
import { AdminService } from "@services/services/Admin.service";
import * as dotenv from "dotenv";
import * as path from "path";
import * as typeorm from "typeorm";
import * as persistence from "../../adminsValidateChangeRole/persistence";
import { CustomContext } from "../../utils/types";
describe("[adminsValidateChangeRole] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("adminsValidateChangeRole", () => {
    it("should Validate change role", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(AdminService.prototype, "userChangeRoleValidation")
        .mockResolvedValue([{ valid: true }] as any);

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
      await persistence.changeRoleValidation(
        ctx as CustomContext,
        "test_qualiyingaccessor_id"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
