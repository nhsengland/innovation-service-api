import * as persistence from "../../innovatorsHeadOne/persistence";
import innovatorsHeadOne from "../../innovatorsHeadOne";
import * as connection from "../../utils/connection";
import * as validation from "../../innovatorsHeadOne/validation";

import {
  runStubFunctionFromBindings,
  createHttpTrigger,
} from "stub-azure-function-context";

describe("[HttpTrigger] innovatorsHeadOne Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("fails when connection is not established", async () => {
      spyOn(connection, "setupSQLConnection").and.throwError(
        "Error establishing connection with the datasource."
      );

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(500);
      expect(res.body.error).toBeDefined();
      expect(res.body.error).toBe(
        "Error establishing connection with the datasource."
      );
    });

    it("fails on missing authorization header", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(validation, "ValidateParams").and.returnValue({
        error: "missing innovatorId",
      });
      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(400);
    });

    it("Should return 200 when Innovator is found", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(persistence, "findInnovatorById").and.returnValue([
        { innovator: "" },
      ]);

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(200);
    });
  });
});

async function mockedRequestFactory(data?: any) {
  return runStubFunctionFromBindings(
    innovatorsHeadOne,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "HEAD",
          "http://nhse-i-aac/api/surveys",
          { ...data.headers }, // headers
          { innovatorId: "test_innovator_id" }, // ?
          {}, // payload/body
          undefined // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
