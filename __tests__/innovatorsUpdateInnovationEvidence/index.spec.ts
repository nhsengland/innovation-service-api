/* eslint-disable */
import { UserType } from "@services/index";
import {
  createHttpTrigger,
  runStubFunctionFromBindings
} from "stub-azure-function-context";
import innovatorsUpdateInnovationEvidence from "../../innovatorsUpdateInnovationEvidence";
import * as persistence from "../../innovatorsUpdateInnovationEvidence/persistence";
import * as validation from "../../innovatorsUpdateInnovationEvidence/validation";
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
  innovationId: "test_innovation_id",
  innovatorId: "test_innovator_id",
  evidenceId: "test_evidence_id",
};

describe("[HttpTrigger] innovatorsUpdateInnovationEvidence Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("fails when connection is not established", async () => {
      jest.spyOn(authentication, 'decodeToken').mockResolvedValue({ oid: ':oid' });
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

    it("Should return 200 when Innovation Evidence is updated", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(validation, "ValidatePayload").mockResolvedValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockResolvedValue({
        oid: dummy.innovatorId,
      });
      jest.spyOn(persistence, "updateInnovationEvidence").mockResolvedValue([
        { id: "" },
      ] as any);
      jest.spyOn(persistence, "getEvidenceWithOwner").mockResolvedValue({
        innovation: {
          owner: {
            id: dummy.innovatorId,
          },
        },
      } as any);

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(200);
    });

    it("Should return 403 when innovator has an invalid user type", async () => {
      const services = {
        UserService: {
          getUser: () => ({
            type: UserType.ACCESSOR,
          }),
        },
      };

      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(services as any);
      jest.spyOn(validation, "ValidatePayload").mockResolvedValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockResolvedValue({
        oid: "test_innovator_id",
      });
      jest.spyOn(persistence, "updateInnovationEvidence").mockResolvedValue([
        { id: "innovation_id" },
      ] as any);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(403);
    });

    it("Should throw error when oid is different from innovatorId", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(validation, "ValidatePayload").mockResolvedValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockResolvedValue({
        oid: "test",
      });
      jest.spyOn(persistence, "updateInnovationEvidence").mockResolvedValue([
        { id: "innovation_id" },
      ] as any);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(403);
    });
  });
});

async function mockedRequestFactory(data?: any) {
  return runStubFunctionFromBindings(
    innovatorsUpdateInnovationEvidence,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "PUT",
          "http://nhse-i-aac/api/innovators/{userId}/innovations/{innovationId}/evidence/{evidenceId}",
          { ...data.headers }, // headers
          {
            userId: dummy.innovatorId,
            innovationId: dummy.innovationId,
            evidenceId: dummy.evidenceId,
          },
          {
            id: dummy.evidenceId,
            innovation: dummy.innovationId,
            evidenceType: "CLINICAL",
            clinicalEvidenceType: "DATA_PUBLISHED",
            description: "",
            summary: "upd 2",
            files: [],
          }, // payload/body
          null // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
