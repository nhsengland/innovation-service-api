import { InnovationActionService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../accessorsGetAllActionsAdvance/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[accessorsGetAllActionsAdvance] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("findAllActionsAdvance", () => {
    it("should assess all innovation actions", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest
        .spyOn(typeorm, "getConnection")
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .mockImplementation(() => ({ close: () => {} } as typeorm.Connection));
      const spy = jest
        .spyOn(InnovationActionService.prototype, "findAllByAccessorAdvanced")
        .mockResolvedValue({ count: 1, data: [{ id: ":id" }] } as any);

      const ctx = {
        services: {
          InnovationActionService: new InnovationActionService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "ACCESSOR",
          },
        },
      };
      // Act
      await persistence.findAllByAccessorAdvanced(
        ctx as CustomContext,
        [],
        [],
        "",
        0,
        10,
        true
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
