import { CommentService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsGetInnovationComments/persistence";
import { CustomContext } from "../../utils/types";

describe("[innovatorsGetInnovationComments] Persistence suite", () => {
  describe("getInnovationComments", () => {
    it("should get all innovation comments", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        CommentService.prototype,
        "findAllByInnovation"
      ).and.returnValue([{ id: "" }]);

      const ctx = {
        services: {
          CommentService: new CommentService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "INNOVATOR",
          },
        },
      };
      // Act
      await persistence.findInnovationComments(
        ctx as CustomContext,
        "E362433E-F36B-1410-80DE-0032FE5B194B"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
