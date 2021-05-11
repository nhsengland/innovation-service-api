import { InnovatorOrganisationRole } from "@services/index";
import {
  createHttpTrigger,
  runStubFunctionFromBindings,
} from "stub-azure-function-context";
import innovatorsUpdateInnovationEvidence from "../../innovatorsCreateInnovationEvidence";
import * as persistence from "../../innovatorsCreateInnovationEvidence/persistence";
import * as validation from "../../innovatorsCreateInnovationEvidence/validation";
import * as authentication from "../../utils/authentication";
import * as connection from "../../utils/connection";
import * as service_loader from "../../utils/serviceLoader";

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
};

describe("[HttpTrigger] innovatorsCreateInnovationEvidence Suite", () => {
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

    it("Should return 201 when Innovation Evidence is created", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(dummy.services);
      spyOn(validation, "ValidatePayload").and.returnValue({});
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: dummy.innovatorId,
      });
      spyOn(persistence, "createInnovationEvidence").and.returnValue([
        { id: "evidence_id" },
      ]);

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(201);
    });

    it("Should return 403 when innovator has an invalid role", async () => {
      const services = {
        OrganisationService: {
          findUserOrganisations: () => [{ role: "other" }],
        },
      };

      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(services);
      spyOn(validation, "ValidatePayload").and.returnValue({});
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: dummy.innovatorId,
      });
      spyOn(persistence, "createInnovationEvidence").and.returnValue([
        { id: "evidence_id" },
      ]);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(403);
    });

    it("Should throw error when oid is different from innovatorId", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(dummy.services);
      spyOn(validation, "ValidatePayload").and.returnValue({});
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: "other",
      });
      spyOn(persistence, "createInnovationEvidence").and.returnValue([
        { id: "evidence_id" },
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
          "POST",
          "http://nhse-i-aac/api/innovators/{innovatorId}/innovations/{innovationId}/evidence",
          { ...data.headers }, // headers
          {
            innovatorId: dummy.innovatorId,
            innovationId: dummy.innovationId,
          },
          {
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
