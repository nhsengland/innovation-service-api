import * as typeorm from "typeorm";
import * as persistence from "../../adminsUpdateOrganisation/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
import { AdminService } from "@services/services/Admin.service";
import { AccessorOrganisationRole } from "@domain/index";
describe("[adminsUpdateOrganisation] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("adminsUpdateOrganisation", () => {
    it("should update Organisation", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(AdminService.prototype, "updateOrganisation")
        .mockResolvedValue({
          organisationId: "organisationId",
          name: "name",
          acronym: "acronym",
        } as any);

      const ctx = {
        services: {
          AdminService: new AdminService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "ADMIN",
          },
        },
      };
      // Act
      await persistence.updateOrganisation(
        ctx as CustomContext,
        "organisationId",
        "name",
        "acronym"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
