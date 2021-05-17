/* eslint-disable */ 
import * as persistence from "../../innovatorsGetInnovationSectionSummary/persistence";
import innovatorsGetInnovationSectionSummary from "../../innovatorsGetInnovationSectionSummary";
import * as connection from "../../utils/connection";
import * as authentication from "../../utils/authentication";
import * as service_loader from "../../utils/serviceLoader";

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
describe("[HttpTrigger] innovatorsGetInnovation Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("fails when connection is not established", async () => {
      spyOn(authentication, 'decodeToken').and.returnValue({oid: ':oid'});
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

    it("Should return 200 when Innovations and sections are found", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(null);
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: "test_innovator_id",
      });
      spyOn(
        persistence,
        "findAllInnovationSectionsByInnovator"
      ).and.returnValue([{ innovation: "test_innovator_id" }]);

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(200);
    });

    it("Should throw error when oid is different from innovatorId", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(null);
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: "test",
      });
      spyOn(
        persistence,
        "findAllInnovationSectionsByInnovator"
      ).and.returnValue([{ id: "innovation_id" }]);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(403);
    });
  });
});

async function mockedRequestFactory(data?: any) {
  return runStubFunctionFromBindings(
    innovatorsGetInnovationSectionSummary,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "GET",
          "http://nhse-i-aac/api/innovators/{innovatorId}/innovations/{innovationId}/section-summary",
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
