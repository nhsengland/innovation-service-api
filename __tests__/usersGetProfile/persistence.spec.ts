import * as persistence from "../../usersGetProfile/persistence";
import { UserService } from "@services/index";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[usersGetProfile] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("usersGetProfile", () => {
    it("should return a user Profile", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(UserService.prototype, "getProfile").and.returnValue([
        { innovator: "" },
      ]);

      const ctx = {
        services: {
          UserService: new UserService(),
        },
      };
      // Act
      await persistence.getProfile(ctx as CustomContext, ":id");

      expect(spy).toHaveBeenCalled();
    });
  });
});
