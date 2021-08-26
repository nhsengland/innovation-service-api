/* eslint-disable */
import { UserType } from "@services/index";
import {
  createHttpTrigger, runStubFunctionFromBindings
} from "stub-azure-function-context";
import assessmentsUpdateInnovationAssessment from "../../assessmentsUpdateInnovationAssessment";
import * as persistence from "../../assessmentsUpdateInnovationAssessment/persistence";
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
        type: UserType.ASSESSMENT,
      }),
    },
  },
  innovationId: "test_innovation_id",
  assessmentUserId: "test_assessment_user_id"
};

describe("[HttpTrigger] assessmentsUpdateInnovationAssessment Suite", () => {
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

    it("Should return 200 when Innovation Assessment is updated", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(dummy.services);
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: dummy.assessmentUserId,
      });

      spyOn(persistence, "updateInnovationAssessment").and.returnValue({ id: "assessment_id" });

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
        oid: dummy.assessmentUserId,
      });

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });

      expect(res.status).toBe(403);
    });

    it("Should throw error when oid is different from userId", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(dummy.services);
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: "test",
      });

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(403);
    });

    it("Should handle error persistence return error", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(dummy.services);
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: dummy.assessmentUserId,
      });
      spyOn(persistence, "updateInnovationAssessment").and.throwError(
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
    assessmentsUpdateInnovationAssessment,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "PUT",
          "http://nhse-i-aac/api/assessments/{userId}/innovations/{innovationId}/assessments/{assessmentId}",
          { ...data.headers },
          {
            assessmentId: ":id",
            userId: dummy.assessmentUserId,
            innovationId: dummy.innovationId
          },
          { description: "test" }, // payload/body
          {} // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
