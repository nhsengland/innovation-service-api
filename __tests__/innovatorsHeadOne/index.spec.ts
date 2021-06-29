/* eslint-disable */
import {
  createHttpTrigger, runStubFunctionFromBindings
} from "stub-azure-function-context";
import innovatorsHeadOne from "../../innovatorsHeadOne";
import * as persistence from "../../innovatorsHeadOne/persistence";
import * as authentication from '../../utils/authentication';
import * as connection from "../../utils/connection";
import * as service_loader from "../../utils/serviceLoader";

jest.mock("../../utils/logging/insights", () => ({
  start: () => { },
  getInstance: () => ({
    startOperation: () => ({
      operation: {
        parentId: ":parent_id",
      },
    }),
    wrapWithCorrelationContext: (func) => {
      return func;
    },
    defaultClient: {
      trackTrace: () => { },
      trackRequest: () => { },
      flush: () => { },
    },
  }),
}));

describe("[HttpTrigger] innovatorsHeadOne Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("fails when connection is not established", async () => {
      spyOn(authentication, 'decodeToken').and.returnValue({ oid: ':oid' });
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

    it("Should return 200 when Innovator is found", async () => {
      spyOn(authentication, 'decodeToken').and.returnValue({ oid: ':oid' });
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(null);
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
