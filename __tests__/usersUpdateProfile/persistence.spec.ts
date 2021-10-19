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
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(UserService.prototype, "updateProfile")
        .mockResolvedValue([{ innovator: "" }] as any);

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
