import { UserService } from "@services/index";
import * as dotenv from "dotenv";
import * as path from "path";
import * as typeorm from "typeorm";
import * as persistence from "../../usersUpdateProfile/persistence";
import { CustomContext } from "../../utils/types";

describe("[usersUpdateProfile] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("usersUpdateProfile", () => {
    it("should return a user Profile", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        UserService.prototype,
        "updateProfile"
      ).and.returnValue([{ innovator: "" }]);

      const ctx = {
        services: {
          UserService: new UserService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "INNOVATOR",
          },
        },
      };
      // Act
      await persistence.updateProfile(ctx as CustomContext, {
        displayName: ":displayName",
      });

      expect(spy).toHaveBeenCalled();
    });
  });
});
