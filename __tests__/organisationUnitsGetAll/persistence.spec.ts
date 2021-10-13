import { OrganisationService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../organisationUnitsGetAll/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[organisationUnitsGetAll] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("findAll", () => {
    it("should find all organisation units", async () => {
      // Arrange
       jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      jest.spyOn(typeorm, "getConnection").mockImplementation((connectionName: string) => ({ close: () => { } }) as typeorm.Connection );
      const spy = jest.spyOn(
        OrganisationService.prototype,
        "findAllWithOrganisationUnits"
      ).mockResolvedValue([
        { id: ":organisation_id", organisationUnits: [{ id: ":unit_id" }] },
      ] as any);

      const ctx = {
        services: {
          OrganisationService: new OrganisationService(),
        },
      };
      // Act
      await persistence.findAll(ctx as CustomContext);

      expect(spy).toHaveBeenCalled();
    });
  });
});
