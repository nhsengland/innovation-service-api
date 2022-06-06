import * as typeorm from "typeorm";
import * as persistence from "../../termsOfUseAccept/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
import { TermsOfUseService } from "@services/index";
describe("[termsOfUseAccept] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("termsOfUseAccept", () => {
    it("should accept terms of use", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(TermsOfUseService.prototype, "acceptTermsOfUse")
        .mockResolvedValue([{ id: "" }] as any);

      const ctx = {
        services: {
          TermsOfUseService: new TermsOfUseService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "INNOVATOR",
          },
        },
      };
      // Act
      await persistence.acceptTermsOfUse(ctx as CustomContext, ":touId");

      expect(spy).toHaveBeenCalled();
    });
  });
});
