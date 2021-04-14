import * as persistence from "../../organisationsGetAll/persistence";
import { OrganisationService } from "nhs-aac-domain-services";
import * as typeorm from "typeorm";

describe("[organisationsGetAll] Persistence suite", () => {
  describe("findAll", () => {
    it("should find all organisations with type", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        OrganisationService.prototype,
        "findAll"
      ).and.returnValue([{ id: "organisationA" }, { id: "organisationB" }]);

      // Act
      await persistence.findAll({ type: "accessor" });

      expect(spy).toHaveBeenCalled();
    });
  });
});
