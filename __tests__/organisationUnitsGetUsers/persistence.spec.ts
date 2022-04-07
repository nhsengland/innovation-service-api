import * as persistence from "../../organisationUnitsGetUsers/persistence";
import { OrganisationService } from "@services/index";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[organisationUnitsGetUsers] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("findOrganisationUnitUsersById", () => {
    it("should assess if Organisation Unit Users exist", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(OrganisationService.prototype, "findOrganisationUnitUsersById")
        .mockResolvedValue([{ id: "organisationUnitId" }] as any);

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
      await persistence.findOrganisationUnitUsers(
        context as CustomContext,
        "organisationUnitId"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
