import {
  InnovationService,
  InnovatorService,
  UserService,
} from "@services/index";
import * as dotenv from "dotenv";
import * as path from "path";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsDeleteAccount/persistence";
import { CustomContext } from "../../utils/types";

describe("[innovatorsDeleteAccount] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("innovatorsDeleteAccount", () => {
    it("should update user ", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(InnovatorService.prototype, "delete").and.returnValue([
        {},
      ]);

      const ctx = {
        services: {
          InnovatorService: new InnovatorService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
          },
        },
      };
      // Act
      await persistence.deleteAccount(ctx as CustomContext, "reason");

      expect(spy).toHaveBeenCalled();
    });
  });
});
