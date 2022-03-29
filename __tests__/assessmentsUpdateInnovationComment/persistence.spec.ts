import { CommentService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../assessmentsUpdateInnovationComment/persistence";
import { CustomContext } from "../../utils/types";
import * as dotenv from "dotenv";
import * as path from "path";
describe("[assessmentsUpdateInnovationComment] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });
  describe("updateInnovationComment", () => {
    it("should update an innovation comment", async () => {
      // Arrange
      jest.spyOn(typeorm, "getRepository").mockImplementation(jest.fn());
      jest.spyOn(typeorm, "getConnection").mockImplementation(
        (connectionName: string) =>
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          ({ close: () => {} } as typeorm.Connection)
      );
      const spy = jest
        .spyOn(CommentService.prototype, "update")
        .mockResolvedValue([{ id: "" }] as any);

      const ctx = {
        services: {
          CommentService: new CommentService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "ASSESSMENT",
          },
        },
      };
      // Act
      await persistence.updateInnovationComment(
        ctx as CustomContext,
        "E362433E-F36B-1410-80DE-0032FE5B194B",
        "F362433E-F36B-1410-80DE-0032FE5B194B",
        "commentID"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
