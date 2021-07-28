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

      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovatorService.prototype,
        "createFirstTimeSignIn"
      ).and.returnValue(result);

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
      await persistence.createInnovator(
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
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(UserService.prototype, "updateB2CUser").and.returnValue(
        null
      );

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
