import { Survey } from "../../schemas/Survey";
import * as persistence from "../../innovatorsCreateOne/persistence";
import {
  Innovation,
  InnovatorService,
  User,
  UserService,
  Organisation,
} from "@services/index";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";

describe("[innovatorsCreateOne] Persistence suite", () => {
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
      const spy = spyOn(
        UserService.prototype,
        "updateUserDisplayName"
      ).and.returnValue(null);

      const ctx = {
        services: {
          UserService: new UserService(),
        },
      };
      // Act
      await persistence.updateUserDisplayName(ctx as CustomContext, {
        user: {},
        oid: "",
      });

      expect(spy).toHaveBeenCalled();
    });
  });
});
