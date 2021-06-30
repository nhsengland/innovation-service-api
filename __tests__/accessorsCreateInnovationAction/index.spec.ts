/* eslint-disable */
import { AccessorOrganisationRole, InnovationSectionCatalogue } from "@services/index";
import {
  createHttpTrigger,
  runStubFunctionFromBindings
} from "stub-azure-function-context";
import accessorsCreateInnovationAction from "../../accessorsCreateInnovationAction";
import * as persistence from "../../accessorsCreateInnovationAction/persistence";
import * as validation from "../../accessorsCreateInnovationAction/validation";
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
    OrganisationService: {
      findUserOrganisations: () => [
        { role: AccessorOrganisationRole.QUALIFYING_ACCESSOR },
      ],
    },
  },
  innovationId: "test_innovation_id",
  accessorId: "test_accessor_id",
};

describe("[HttpTrigger] accessorsCreateInnovationAction Suite", () => {
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

    it("Should return 201 when Innovation Action is created", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(dummy.services);
      spyOn(validation, "ValidatePayload").and.returnValue({});
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: dummy.accessorId,
      });
      spyOn(persistence, "createInnovationAction").and.returnValue([
        { id: "action_id" },
      ]);

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(201);
    });

    it("Should return 403 when accessor has an invalid role", async () => {
      const services = {
        OrganisationService: {
          findUserOrganisations: () => [{ role: "other" }],
        },
      };

      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(services);
      spyOn(validation, "ValidatePayload").and.returnValue({});
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: dummy.accessorId,
      });
      spyOn(persistence, "createInnovationAction").and.returnValue([
        { id: "action_id" },
      ]);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(403);
    });

    it("Should throw error when oid is different from accessorId", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(dummy.services);
      spyOn(validation, "ValidatePayload").and.returnValue({});
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: "other",
      });
      spyOn(persistence, "createInnovationAction").and.returnValue([
        { id: "action_id" },
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
    accessorsCreateInnovationAction,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "POST",
          "http://nhse-i-aac/api/accessors/{userId}/innovations/{innovationId}/actions",
          { ...data.headers }, // headers
          {
            userId: dummy.accessorId,
            innovationId: dummy.innovationId,
          },
          {
            description: ":description",
            section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION
          }, // payload/body
          null // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
