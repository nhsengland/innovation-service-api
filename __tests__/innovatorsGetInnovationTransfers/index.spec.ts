/* eslint-disable */
import { UserType } from "@services/index";
import {
  createHttpTrigger,
  runStubFunctionFromBindings
} from "stub-azure-function-context";
import innovatorsGetInnovationTransfers from "../../innovatorsGetInnovationTransfers";
import * as persistence from "../../innovatorsGetInnovationTransfers/persistence";
import * as authentication from "../../utils/authentication";
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

const dummy = {
  services: {
    UserService: {
      getUser: () => ({
        type: UserType.INNOVATOR,
      }),
    },
  },
  innovatorId: 'test_innovator_id'
};

describe("[HttpTrigger] innovatorsGetInnovationTransfers Suite", () => {
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

    it("Should return 200 when get Innovation Transfers", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(dummy.services);
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: dummy.innovatorId,
      });
      spyOn(persistence, "findInnovationTransfers").and.returnValue(
        {
          id: "", innovation: {
            owner: {
              id: dummy.innovatorId,
            },
          }
        },
      );

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(200);
    });

  });
});

async function mockedRequestFactory(data?: any) {
  return runStubFunctionFromBindings(
    innovatorsGetInnovationTransfers,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "GET",
          "http://nhse-i-aac/api/innovators/innovation-transfers",
          { ...data.headers }, // headers
          {},
          null, // payload/body
          {} // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
