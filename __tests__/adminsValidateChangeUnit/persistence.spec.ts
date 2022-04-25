import { UserService } from "@services/index";
import { AdminService } from "@services/services/Admin.service";
import * as dotenv from "dotenv";
import * as path from "path";
import * as typeorm from "typeorm";
import * as persistence from "../../adminsValidateChangeUnit/persistence";
import { CustomContext } from "../../utils/types";
describe("[adminsValidateChangeUnit] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("adminsValidateChangeUnit", () => {
    it("should Validate change unit", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(AdminService.prototype, "userChangeUnitValidation")
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
      await persistence.changeUnitValidation(
        ctx as CustomContext,
        "test_qualiyingaccessor_id"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
