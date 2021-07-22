import { UserService, UserType } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../adminsCreateUsers/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[adminsCreateUsers] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("adminsCreateUsers", () => {
    it("should create users", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(UserService.prototype, "createUsers").and.returnValue([
        { id: "" },
      ]);

      const ctx = {
        services: {
          UserService: new UserService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "ASSESSMENT",
          },
        },
      };
      // Act
      await persistence.createUsers(ctx as CustomContext, [
        {
          type: UserType.ASSESSMENT,
          name: ":email",
          email: "email@aaa.com",
        },
      ]);

      expect(spy).toHaveBeenCalled();
    });
  });
});
