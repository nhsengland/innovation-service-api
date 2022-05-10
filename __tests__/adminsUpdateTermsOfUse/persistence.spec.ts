import * as typeorm from "typeorm";
import * as persistence from "../../adminsUpdateTermsOfUse/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
import { TermsOfUseService } from "@services/services/TermsOfUse.service";
import { TouType } from "@domain/index";
describe("[adminsUpdateTermsOfUse] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("adminsUpdateTermsOfUse", () => {
    it("should update TermsOfUse", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(TermsOfUseService.prototype, "updateTermsOfUse")
        .mockResolvedValue([{ name: "" }] as any);

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
      await persistence.updateTermsOfUse(
        ctx as CustomContext,
        {
          name: "Version1",
          touType: TouType.INNOVATOR,
          summary: "Test",
        },
        "testId"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
