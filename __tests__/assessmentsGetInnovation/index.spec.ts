/* eslint-disable */
import { UserType } from "@services/index";
import {
  createHttpTrigger, runStubFunctionFromBindings
} from "stub-azure-function-context";
import assessmentsGetInnovation from "../../assessmentsGetInnovation";
import * as persistence from "../../assessmentsGetInnovation/persistence";
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
    InnovationService: {
      getAssessmentInnovationSummary: () => ({
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
      }),
    },
    UserService: {
      getUser: () => ({
        type: UserType.ASSESSMENT,
      }),
    },
  },
};
describe("[HttpTrigger] assessmentsGetInnovation Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("fails when connection is not established", async () => {
      jest.spyOn(authentication, "decodeToken").mockReturnValue({ oid: ":oid" });
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

    it("Should return 200 when Innovation is found", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: "test_assessment_oid",
      });

      jest.spyOn(persistence, "getAssessmentInnovationSummary").mockResolvedValue({
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
      } as any);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });

      expect(res.status).toBe(200);
    });

    it("Should return 403 when user is not of type ASSESSMENT", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      const modifiedServices = {
        ...dummy.services,
        UserService: {
          getUser: () => ({
            type: UserType.ACCESSOR,
          }),
        },
      };
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(
        modifiedServices as any
      );
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: "test_assessment_oid",
      });

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });

      expect(res.status).toBe(403);
    });

    it("Should handle error persistence return error", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: "test_assessment_oid",
      });
      jest.spyOn(persistence, "getAssessmentInnovationSummary").mockRejectedValue(
        "Error."
      );

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(500);
    });
  });
});

async function mockedRequestFactory(data?: any) {
  return runStubFunctionFromBindings(
    assessmentsGetInnovation,
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
          {} // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
