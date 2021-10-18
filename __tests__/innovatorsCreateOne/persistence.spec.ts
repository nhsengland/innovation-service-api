import {
  Innovation,
  InnovatorService,
  Organisation,
  User,
  UserService,
} from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsCreateOne/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[innovatorsCreateOne] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("createInnovator", () => {
    it("should create an Innovator and its dependencies", async () => {
      // Arrange
      const innovator = new User();
      const innovation = new Innovation();
      const organisation = new Organisation();
      const result = {
        innovator,
        innovation,
        organisation,
      };

      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(InnovatorService.prototype, "createFirstTimeSignIn")
        .mockResolvedValue(result as any);

      const ctx = {
        services: {
          InnovatorService: new InnovatorService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "INNOVATOR",
          },
        },
      };
      // Act
      await persistence.createFirstTimeSignIn(
        ctx as CustomContext,
        innovator,
        innovation,
        organisation
      );

      expect(spy).toHaveBeenCalled();
    });
  });

  describe("updateDisplayName", () => {
    it("should update an Innovator displayName", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(UserService.prototype, "updateB2CUser")
        .mockResolvedValue(null);

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
      await persistence.updateB2CUser(ctx as CustomContext, {
        user: {},
        oid: "",
      });

      expect(spy).toHaveBeenCalled();
    });
  });
});
