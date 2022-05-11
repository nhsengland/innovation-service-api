import * as persistence from "../../termsOfUseCheckIfUserAccepted/persistence";
import { TermsOfUseService } from "@services/index";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";

describe("[termsOfUseCheckIfUserAccepted] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("termsOfUseCheckIfUserAccepted", () => {
    it("should assess if a terms of use exists", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(TermsOfUseService.prototype, "checkIfUserAccepted")
        .mockResolvedValue([] as any);

      const context = {
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
      await persistence.termsOfUseCheckIfUserAccepted(context as CustomContext);

      expect(spy).toHaveBeenCalled();
    });
  });
});
