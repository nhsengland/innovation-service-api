import * as typeorm from "typeorm";
import * as persistence from "../../adminsUpdateUserOrganisationUnit/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
import { UserService } from "@services/services/User.service";
import { AccessorOrganisationRole, User } from "@domain/index";
describe("[adminsUpdateUserOrganisationUnit] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("adminsUpdateUserOrganisationUnit", () => {
    it("should update Organisation", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(UserService.prototype, "updateUserOrganisationUnit")
        .mockResolvedValue({
          userId: "userId",
          newOrganisationUnitAcronym: "acronym",
          organisationId: "organisationId",
        } as any);

      const ctx = {
        services: {
          UserService: new UserService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "ADMIN",
          },
        },
      };
      // Act
      await persistence.updateUserOrganisationUnit(
        ctx as CustomContext,
        "userId",
        "acronym",
        "organisationId"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
