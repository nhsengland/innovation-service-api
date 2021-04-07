import { Survey } from "../../schemas/Survey";
import * as persistence from "../../innovatorsCreateOne/persistence";
import {
  Innovation,
  InnovatorService,
  User,
  ADUserService,
  Organisation,
} from "nhs-aac-domain-services";
import * as typeorm from "typeorm";

describe("[innovatorCreateOne] Persistence suite", () => {
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

      // Act
      await persistence.createInnovator(innovator, innovation, organisation);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe("updateDisplayName", () => {
    it("should update an Innovator displayName", async () => {
      // Arrange

      const spy = spyOn(
        ADUserService.prototype,
        "updateUserDisplayName"
      ).and.returnValue(null);

      // Act
      await persistence.updateUserDisplayName({ user: {}, oid: "" });

      expect(spy).toHaveBeenCalled();
    });
  });
});
