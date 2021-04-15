import * as persistence from "../../usersGetProfile/persistence";
import { ADUserService } from "nhs-aac-domain-services";
import * as typeorm from "typeorm";

describe("[usersGetProfile] Persistence suite", () => {
  describe("usersGetProfile", () => {
    it("should return a user Profile", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(ADUserService.prototype, "getProfile").and.returnValue([
        { innovator: "" },
      ]);

      // Act
      await persistence.getProfile(":id");

      expect(spy).toHaveBeenCalled();
    });
  });
});
