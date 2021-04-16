import * as persistence from "../../accessorsGetAllInnovations/persistence";
import accessorsGetAllInnovations from "../../accessorsGetAllInnovations";
import * as connection from "../../utils/connection";
import * as authentication from "../../utils/authentication";

import {
  runStubFunctionFromBindings,
  createHttpTrigger,
} from "stub-azure-function-context";

describe("[HttpTrigger] accessorsGetAllInnovations Suite", () => {
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

    it("Should return 200 when Accessors is found", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: "test_accessor_id",
      });
      spyOn(persistence, "findAllInnovationsByAccessor").and.returnValue([
        { innovator: "test_accessor_id" },
      ]);

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(200);
    });
  });
});

async function mockedRequestFactory(data?: any) {
  return runStubFunctionFromBindings(
    accessorsGetAllInnovations,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "GET",
          "http://nhse-i-aac/api/accessors/{accessorId}/accessors",
          { ...data.headers }, // headers
          { accessorId: "test_accessor_id" }, // ?
          {}, // payload/body
          undefined // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
