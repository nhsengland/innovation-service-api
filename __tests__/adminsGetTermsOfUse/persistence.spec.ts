import * as typeorm from "typeorm";
import * as persistence from "../../adminsGetTermsOfUse/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
import { TermsOfUseService } from "@services/services/TermsOfUse.service";

describe("[adminsGetTermsOfUse] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("adminsGetTermsOfUse", () => {
    it("should Get TermsOfUse", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(TermsOfUseService.prototype, "findTermsOfUseById")
        .mockResolvedValue([{ Id: "test1" }] as any);

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
      await persistence.createTermsOfUse(ctx as CustomContext, "TestId");

      expect(spy).toHaveBeenCalled();
    });
  });
});
