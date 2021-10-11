/* eslint-disable */
import * as persistence from "../../organisationsGetAll/persistence";
import organisationsGetAll from "../../organisationsGetAll";
import * as connection from "../../utils/connection";
import * as service_loader from "../../utils/serviceLoader";
import * as authentication from "../../utils/authentication";

import {
  runStubFunctionFromBindings,
  createHttpTrigger,
} from "stub-azure-function-context";

jest.mock("../../utils/logging/insights", () => ({
  start: () => {},
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
      trackTrace: () => {},
      trackRequest: () => {},
      flush: () => {},
    },
  }),
}));

describe("[HttpTrigger] organisationsGetAll Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("fails when connection is not established", async () => {
      jest.spyOn(authentication, 'decodeToken').mockResolvedValue({oid: ':oid'});
      jest.spyOn(connection, "setupSQLConnection").mockRejectedValue(
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
      jest.spyOn(authentication, 'decodeToken').mockResolvedValue({oid: ':oid'});
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(null);

      jest.spyOn(persistence, "findAll").mockResolvedValue([
        { id: "organisation_id" },
      ] as any);

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(200);
    });

    it("Should return 404 when not found", async () => {
      jest.spyOn(authentication, 'decodeToken').mockResolvedValue({oid: ':oid'});
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(null);

      jest.spyOn(persistence, "findAll").mockResolvedValue(undefined);

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(404);
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
