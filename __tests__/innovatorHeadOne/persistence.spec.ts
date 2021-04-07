import * as persistence from "../../innovatorsHeadOne/persistence";
import { InnovatorService } from "nhs-aac-domain-services";
import * as typeorm from "typeorm";

describe("[innovatorHeadOne] Persistence suite", () => {
  describe("headInnovator", () => {
    it("should assess if an Innovator exists", async () => {
      // Arrange
      spyOn(typeorm, "getRepository");
      spyOn(typeorm, "getConnection");
      const spy = spyOn(InnovatorService.prototype, "find").and.returnValue([
        { innovator: "" },
      ]);

      // Act
      await persistence.findInnovatorById("test_innovator_oid");

      expect(spy).toHaveBeenCalled();
    });
  });
});
