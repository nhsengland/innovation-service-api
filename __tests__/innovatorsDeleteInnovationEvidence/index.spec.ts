/* eslint-disable */ 
import { InnovatorOrganisationRole } from "@services/index";
import {
  createHttpTrigger,
  runStubFunctionFromBindings,
} from "stub-azure-function-context";
import innovatorsUpdateInnovationEvidence from "../../innovatorsDeleteInnovationEvidence";
import * as persistence from "../../innovatorsDeleteInnovationEvidence/persistence";
import * as authentication from "../../utils/authentication";
import * as connection from "../../utils/connection";
import * as service_loader from "../../utils/serviceLoader";

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
    OrganisationService: {
      findUserOrganisations: () => [
        { role: InnovatorOrganisationRole.INNOVATOR_OWNER },
      ],
    },
  },
  innovationId: "test_innovation_id",
  innovatorId: "test_innovator_id",
  evidenceId: "test_evidence_id",
};

describe("[HttpTrigger] innovatorsDeleteInnovationEvidence Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("fails when connection is not established", async () => {
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

    it("Should return 200 when Innovation Evidence is deleted", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(dummy.services);
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: dummy.innovatorId,
      });
      spyOn(persistence, "deleteInnovationEvidence").and.returnValue([
        { id: "" },
      ]);

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(200);
    });

    it("Should return 403 when innovator has an invalid role", async () => {
      const services = {
        OrganisationService: {
          findUserOrganisations: () => [{ role: "other" }],
        },
      };

      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(services);
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: dummy.innovatorId,
      });
      spyOn(persistence, "deleteInnovationEvidence").and.returnValue([
        { id: dummy.evidenceId },
      ]);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(403);
    });

    it("Should throw error when oid is different from innovatorId", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(dummy.services);
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: "test",
      });
      spyOn(persistence, "deleteInnovationEvidence").and.returnValue([
        { id: "other" },
      ]);

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
          "delete",
          "http://nhse-i-aac/api/innovators/{innovatorId}/innovations/{innovationId}/evidence/{evidenceId}",
          { ...data.headers }, // headers
          {
            innovatorId: dummy.innovatorId,
            innovationId: dummy.innovationId,
            evidenceId: dummy.evidenceId,
          },
          null, // payload/body
          null // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
