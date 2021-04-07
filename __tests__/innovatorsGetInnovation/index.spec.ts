import * as persistence from "../../innovatorsGetInnovation/persistence";
import innovatorsGetInnovation from "../../innovatorsGetInnovation";
import * as connection from "../../utils/connection";
import * as authentication from "../../utils/authentication";

import {
  runStubFunctionFromBindings,
  createHttpTrigger,
} from "stub-azure-function-context";

describe("[HttpTrigger] innovatorsGetInnovation Suite", () => {
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

    it("Should return 200 when Innovations is found", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: "test_innovator_id",
      });
      spyOn(persistence, "findInnovationsByInnovator").and.returnValue([
        { innovation: "test_innovator_id" },
      ]);

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(200);
    });
  });
});

async function mockedRequestFactory(data?: any) {
  return runStubFunctionFromBindings(
    innovatorsGetInnovation,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "GET",
          "http://nhse-i-aac/api/innovators/{innovatorId}/innovations/{innovationId}",
          { ...data.headers }, // headers
          {
            innovatorId: "test_innovator_id",
            innovationId: "test_innovation_id",
          }, // ?
          {}, // payload/body
          undefined // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
