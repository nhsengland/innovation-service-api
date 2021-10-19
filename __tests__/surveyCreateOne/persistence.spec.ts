import { Survey } from "../../schemas/Survey";
import * as persistence from "../../surveyCreateOne/persistence";
import * as dotenv from "dotenv";
import * as path from "path";

describe("[surveyCreateOne] Persistence suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "../.environment"),
    });
  });

  describe("Save", () => {
    it("should call save", async () => {
      const input = { prop: 1 };
      const spy = jest.spyOn(Survey.prototype, "save").mockImplementation();

      await persistence.Save(input);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe("GetId", () => {
    it("should return an id", async () => {
      const survey = new Survey();
      jest.spyOn(Survey.prototype, "get").mockReturnValue("aaabbbcccddd");
      const result = persistence.GetId(survey);

      expect(result).toBe("aaabbbcccddd");
    });
  });
});
