/* eslint-disable */
import { UserType } from "@services/index";
import {
  createHttpTrigger, runStubFunctionFromBindings
} from "stub-azure-function-context";
import assessmentsGetInnovationSectionSummary from "../../assessmentsGetInnovationSectionSummary";
import * as persistence from "../../assessmentsGetInnovationSectionSummary/persistence";
import * as authentication from "../../utils/authentication";
import * as connection from "../../utils/connection";
import * as service_loader from "../../utils/serviceLoader";
import * as decorators from "../../utils/decorators";

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
      getUserByOptions: () => ({
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
    beforeAll(()=> {
      jest.spyOn(decorators, "AllowedUserType").mockImplementation();
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

    it("Should return 200 when Innovations and sections are found", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: "C7095D87-C3DF-46F6-A503-001B083F4630",
      });
      jest.spyOn(
        persistence,
        "findAllInnovationSectionsByAssessment"
      ).mockResolvedValue([{ innovation: "test_assessment_id" }] as any);

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(200);
    });

    it("Should return 403 when assessment has an invalid user type", async () => {
      const services = {
        UserService: {
          getUser: () => ({
            type: UserType.ACCESSOR,
          }),
          getUserByOptions: () => ({
            type: UserType.ACCESSOR,
          }),
        },
      };

      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(services as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: "C7095D87-C3DF-46F6-A503-001B083F4630",
      });
      jest.spyOn(persistence, "findAllInnovationSectionsByAssessment").mockResolvedValue([
        { id: "innovation_id" },
      ] as any);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(403);
    });

    it.skip("Should throw error when oid is different from assessmentId", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: "D7095D87-C3DF-46F6-A503-001B083F4630",
      });
      jest.spyOn(
        persistence,
        "findAllInnovationSectionsByAssessment"
      ).mockResolvedValue([{ id: "innovation_id" }] as any);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(403);
    });

    it("Should handle error persistence return error", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: "C7095D87-C3DF-46F6-A503-001B083F4630",
      });
      jest.spyOn(persistence, "findAllInnovationSectionsByAssessment").mockRejectedValue(
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
    assessmentsGetInnovationSectionSummary,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "GET",
          "http://nhse-i-aac/api/assessments/{userId}/innovations/{innovationId}/section-summary",
          { ...data.headers }, // headers
          {
            userId: "C7095D87-C3DF-46F6-A503-001B083F4630",
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
