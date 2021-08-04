import { UserService } from "@services/index";
import * as dotenv from "dotenv";
import * as path from "path";
import * as typeorm from "typeorm";
import * as persistence from "../../adminsUpdateUsers/persistence";
import { CustomContext } from "../../utils/types";
describe("[adminsUpdateUsers] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("adminsUpdateUsers", () => {
    it("should update users", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(UserService.prototype, "updateUsers").and.returnValue([
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
      await persistence.updateUsers(ctx as CustomContext, [
        {
          id: "aaa-bbb-ccc",
          properties: {
            test: "abc",
          },
        },
      ]);

      expect(spy).toHaveBeenCalled();
    });
  });
});
