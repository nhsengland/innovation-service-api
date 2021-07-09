/* eslint-disable */ 
import * as persistence from "../../assessmentsListInnovations/persistence";
import assessmentsListInnovations from "../../assessmentsListInnovations";
import * as authentication from "../../utils/authentication";
import * as connection from "../../utils/connection";
import * as service_loader from "../../utils/serviceLoader";

import {
  runStubFunctionFromBindings,
  createHttpTrigger,
} from "stub-azure-function-context";
import { UserType } from "@services/index";

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

const dummy = {
  services: {
    InnovationService: {
      getInnovationListByState: () => ({
       data: [
         
       ],
       count: 0,
      }),
    },
    UserService: {
      getUser: () => ({
        type: UserType.ASSESSMENT,
      }),
    },
  },
};
describe("[HttpTrigger] assessmentsListInnovations Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("fails when connection is not established", async () => {
      spyOn(authentication, "decodeToken").and.returnValue({ oid: ":oid" });
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

    it("Should return 200 when Innovation is found", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(dummy.services);
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: "test_assessment_oid",
      });

      spyOn(persistence, "getInnovationList").and.returnValue({
        summary: {
          id: ":innovation_id",
          company: ":company_name",
          location: ":company_location",
          description: ":description",
          categories: ["TYPE1", "TYPE2"],
        },
        contact: {
          name: ":display_name",
          email: "user_email@example.com",
          phone: "0351900000000",
        },
      });

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });

      expect(res.status).toBe(200);
    });

    it("Should return 403 when user is not of type ASSESSMENT", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      const modifiedServices = {
        ...dummy.services,
        UserService: {
          getUser: () => ({
            type: UserType.ACCESSOR,
          }),
        },
      };
      spyOn(service_loader, "loadAllServices").and.returnValue(
        modifiedServices
      );
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: "test_assessment_oid",
      });

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });

      expect(res.status).toBe(403);
    });
  });
});

async function mockedRequestFactory(data?: any) {
  return runStubFunctionFromBindings(
    assessmentsListInnovations,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "GET",
          "http://nhse-i-aac/api/assessments/innovations/{innovationId}",
          { ...data.headers }, // headers
          { innovationId: "test_innovation_id" }, // ?
          {}, // payload/body
          {status: 'user_id_1,user_id_2,user_id_3', skip: 0, take: 20} // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
