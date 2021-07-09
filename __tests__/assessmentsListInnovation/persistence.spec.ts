import { InnovationService } from "@services/index";
import * as typeorm from "typeorm";
import * as persistence from "../../assessmentsListInnovations/persistence";
import { CustomContext } from "../../utils/types";

describe("[assessmentsListInnovation] Persistence suite", () => {
  describe("getInnovationListByState", () => {
    it("should assess if an innovation section exists", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(
        InnovationService.prototype,
        "getInnovationListByState"
      ).and.returnValue([{ id: ":id" }]);

      const ctx = {
        services: {
          InnovationService: new InnovationService(),
        },
        auth: {
          requestUser: {
            id: ":userId",
            type: "ASSESSMENT",
          },
        },
      };
      // Act
      await persistence.getInnovationList(ctx as CustomContext, [], 0, 10);

      expect(spy).toHaveBeenCalled();
    });
  });
});
