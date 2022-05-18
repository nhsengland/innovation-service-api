import * as typeorm from "typeorm";
import * as persistence from "../../adminsGetTermsOfUses/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
import { TermsOfUseService } from "@services/services/TermsOfUse.service";
describe("[adminsGetTermsOfUses] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("adminsGetTermsOfUses", () => {
    it("should Get TermsOfUses", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(TermsOfUseService.prototype, "findAllTermsOfUse")
        .mockResolvedValue([{ take: 0, skip: 10 }] as any);

      const ctx = {
        services: {
          TermsOfUseService: new TermsOfUseService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "ADMIN",
          },
        },
      };
      // Act
      await persistence.createTermsOfUses(ctx as CustomContext, 0, 10);

      expect(spy).toHaveBeenCalled();
    });
  });
});
