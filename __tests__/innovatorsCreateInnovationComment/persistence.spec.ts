import { CommentService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../innovatorsCreateInnovationComment/persistence";
import { CustomContext } from "../../utils/types";

describe("[innovatorsCreateInnovationComment] Persistence suite", () => {
  describe("createInnovationComment", () => {
    it("should create an innovation comment", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(CommentService.prototype, "create").and.returnValue([
        { id: "" },
      ]);

      const ctx = {
        services: {
          CommentService: new CommentService(),
        },
        auth: {
          userOrganisations: [],
        },
      };
      // Act
      await persistence.createInnovationComment(
        ctx as CustomContext,
        "E362433E-F36B-1410-80DE-0032FE5B194B",
        "F362433E-F36B-1410-80DE-0032FE5B194B",
        "my comment"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
