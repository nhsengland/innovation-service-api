import * as persistence from "../../organisationsGetAll/persistence";
import { OrganisationService } from "@services/index";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[organisationsGetAll] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("findAll", () => {
    it("should find all organisations with type", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        OrganisationService.prototype,
        "findAll"
      ).and.returnValue([{ id: "organisationA" }, { id: "organisationB" }]);

      const ctx = {
        services: {
          OrganisationService: new OrganisationService(),
        },
      };
      // Act
      await persistence.findAll(ctx as CustomContext, { type: "accessor" });

      expect(spy).toHaveBeenCalled();
    });
  });
});
