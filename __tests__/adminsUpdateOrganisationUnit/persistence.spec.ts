import * as typeorm from "typeorm";
import * as persistence from "../../adminsUpdateOrganisationUnit/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
import { OrganisationService } from "@services/services/Organisation.service";
import { AccessorOrganisationRole } from "@domain/index";
describe("[adminsUpdateOrganisationUnit] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("adminsUpdateOrganisationUnit", () => {
    it("should update Organisation", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(OrganisationService.prototype, "updateOrganisationUnit")
        .mockResolvedValue({
          organisationId: "organisationUnitId",
          name: "name",
          acronym: "acronym",
        } as any);

      const ctx = {
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
      await persistence.updateOrganisationUnit(
        ctx as CustomContext,
        "organisationUnitId",
        "name",
        "acronym"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
