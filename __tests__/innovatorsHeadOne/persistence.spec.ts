import * as persistence from "../../innovatorsHeadOne/persistence";
import { InnovatorService } from "nhs-aac-domain-services";
import * as typeorm from "typeorm";
import { CustomContext } from "../../utils/types";

describe("[innovatorsHeadOne] Persistence suite", () => {
  describe("headInnovator", () => {
    it("should assess if an Innovator exists", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(InnovatorService.prototype, "find").and.returnValue([
        { innovator: "" },
      ]);

      const ctx = {
        services: {
          InnovatorService: new InnovatorService(),
        },
      };
      // Act
      await persistence.findInnovatorById(
        ctx as CustomContext,
        "test_innovator_oid"
      );

      expect(spy).toHaveBeenCalled();
    });
  });
});
