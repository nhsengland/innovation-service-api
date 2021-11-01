/* eslint-disable */
import { UserType } from "@services/index";
import {
  createHttpTrigger,
  runStubFunctionFromBindings
} from "stub-azure-function-context";
import assessmentsCreateInnovationComment from "../../assessmentsCreateInnovationComment";
import * as persistence from "../../assessmentsCreateInnovationComment/persistence";
import * as validation from "../../assessmentsCreateInnovationComment/validation";
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

describe("[HttpTrigger] assessmentsCreateInnovationComment Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("fails when connection is not established", async () => {
      jest.spyOn(authentication, 'decodeToken').mockReturnValue({ oid: ':oid' });
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

    it("Should return 201 when Innovation Comment is created", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(validation, "ValidatePayload").mockReturnValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: dummy.assessmentUserId,
      });
      jest.spyOn(persistence, "createInnovationComment").mockResolvedValue([
        { id: "comment_id" },
      ] as any);

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(201);
    });

    it("Should throw error when oid is different from assessmentUserId", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(validation, "ValidatePayload").mockReturnValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: "other",
      });
      jest.spyOn(persistence, "createInnovationComment").mockResolvedValue([
        { id: "comment_id" },
      ] as any);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(403);
    });

    it("Should handle error persistence return error", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: dummy.assessmentUserId,
      });
      jest.spyOn(persistence, "createInnovationComment").mockRejectedValue(
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
    assessmentsCreateInnovationComment,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "POST",
          "http://nhse-i-aac/api/assessments/{userId}/innovations/{innovationId}/comments",
          { ...data.headers }, // headers
          {
            userId: dummy.assessmentUserId,
            innovationId: dummy.innovationId,
          },
          {
            comment: ":comment",
          }, // payload/body
          null // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
