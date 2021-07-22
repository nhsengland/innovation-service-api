import * as persistence from "../../accessorsGetAll/persistence";
import { OrganisationService } from "@services/index";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[accessorsGetAll] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("findUserOrganisationUnitUsers", () => {
    it("should get accessors list", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        OrganisationService.prototype,
        "findUserOrganisationUnitUsers"
      ).and.returnValue([{ id: "accessorA" }, { id: "accessorB" }]);

      const ctx = {
        services: {
          OrganisationService: new OrganisationService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "ACCESSOR",
          },
        },
      };
      // Act
      await persistence.findUserOrganisationUnitUsers(ctx as CustomContext);

      expect(spy).toHaveBeenCalled();
    });
  });
});
