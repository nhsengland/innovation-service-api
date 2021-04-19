import * as persistence from "../../usersGetProfile/persistence";
import { UserService } from "nhs-aac-domain-services";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";

describe("[usersGetProfile] Persistence suite", () => {
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
