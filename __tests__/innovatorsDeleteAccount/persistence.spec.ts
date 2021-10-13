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
    it("should delete user ", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      jest.spyOn(typeorm, "getConnection").mockImplementation((connectionName: string) => ({ close: () => { } }) as typeorm.Connection );
      const spy = jest.spyOn(InnovatorService.prototype, "delete").mockResolvedValue([
        {},
      ] as any);

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
