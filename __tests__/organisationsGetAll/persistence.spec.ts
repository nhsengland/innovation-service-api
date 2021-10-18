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
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(OrganisationService.prototype, "findAll")
        .mockResolvedValue([
          { id: "organisationA" },
          { id: "organisationB" },
        ] as any);

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
