import * as persistence from "../../innovatorsSubmitInnovationSections/persistence";
import * as validation from "../../innovatorsSubmitInnovationSections/validation";
import innovatorsSubmitInnovationSection from "../../innovatorsSubmitInnovationSections";
import * as connection from "../../utils/connection";
import * as authentication from "../../utils/authentication";
import * as service_loader from "../../utils/serviceLoader";

import {
  runStubFunctionFromBindings,
  createHttpTrigger,
} from "stub-azure-function-context";
import { InnovatorOrganisationRole } from "@services/index";

const dummy = {
  services: {
    OrganisationService: {
      findUserOrganisations: () => [
        { role: InnovatorOrganisationRole.INNOVATOR_OWNER },
      ],
    },
  },
};

describe("[HttpTrigger] innovatorsSubmitInnovationSection Suite", () => {
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

    it("Should return 204 when Innovation sections are submitted", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(dummy.services);
      spyOn(validation, "ValidatePayload").and.returnValue({});
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: "test_innovator_id",
      });
      spyOn(persistence, "submitInnovationSections").and.returnValue([{}]);

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(204);
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
        oid: "test_innovator_id",
      });
      spyOn(persistence, "submitInnovationSections").and.returnValue([{}]);

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
        oid: "test",
      });
      spyOn(persistence, "submitInnovationSections").and.returnValue([{}]);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(403);
    });
  });
});

async function mockedRequestFactory(data?: any) {
  return runStubFunctionFromBindings(
    innovatorsSubmitInnovationSection,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "PATCH",
          "http://nhse-i-aac/api/innovators/{innovatorId}/innovations/{innovationId}/sections/submit",
          { ...data.headers }, // headers
          {
            innovatorId: "test_innovator_id",
            innovationId: "test_innovation_id",
          }, // ?
          {
            sections: ["INNOVATION_DESCRIPTION"],
          }, // payload/body
          null // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
