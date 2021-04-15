import * as persistence from "../../organisationsGetAll/persistence";
import * as validation from "../../organisationsGetAll/validation";
import organisationsGetAll from "../../organisationsGetAll";
import * as connection from "../../utils/connection";

import {
  runStubFunctionFromBindings,
  createHttpTrigger,
} from "stub-azure-function-context";

describe("[HttpTrigger] organisationsGetAll Suite", () => {
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

    it("Should return 200 when Organisations is found", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(persistence, "findAll").and.returnValue([
        { id: "organisation_id" },
      ]);

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(200);
    });
  });
});

async function mockedRequestFactory(data?: any) {
  return runStubFunctionFromBindings(
    organisationsGetAll,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "GET",
          "http://nhse-i-aac/api/organisations?type=accessor",
          { ...data.headers }, // headers
          {}, // params
          {}, // payload/body
          { type: "accessor" } // query params
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
