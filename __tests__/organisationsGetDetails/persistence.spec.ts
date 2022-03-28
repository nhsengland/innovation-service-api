import * as persistence from "../../organisationsGetDetails/persistence";
import { OrganisationService } from "@services/index";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[organisationsGetDetails] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("findOrganisationById", () => {
    it("should assess if a Organisation exists", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(OrganisationService.prototype, "findOrganisationById")
        .mockResolvedValue([{ id: "organisationA" }] as any);

      const context = {
        services: {
          OrganisationService: new OrganisationService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "ADMIN",
          },
        },
      };
      // Act
      await persistence.findOrganisation(
        context as CustomContext,
        "organisationA"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
