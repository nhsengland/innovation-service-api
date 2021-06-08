/* eslint-disable */ 
import * as persistence from "../../accessorsGetInnovationSections/persistence";
import * as validation from "../../accessorsGetInnovationSections/validation";
import accessorsGetInnovationSection from "../../accessorsGetInnovationSections";
import * as connection from "../../utils/connection";
import * as authentication from "../../utils/authentication";
import * as service_loader from "../../utils/serviceLoader";

import {
  runStubFunctionFromBindings,
  createHttpTrigger,
} from "stub-azure-function-context";
import { AccessorOrganisationRole } from "@services/index";

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
        { role: AccessorOrganisationRole.QUALIFYING_ACCESSOR },
      ],
    },
  },
};

describe("[HttpTrigger] accessorsGetInnovationSection Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("fails when connection is not established", async () => {
      spyOn(authentication, 'decodeToken').and.returnValue({oid: ':oid'});
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

    it("Should return 200 when Innovation Section is found", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(dummy.services);
      spyOn(validation, "ValidateQueryParams").and.returnValue({});
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: "test_accessor_id",
      });
      spyOn(persistence, "findInnovationSectionByAccessor").and.returnValue([
        { section: "SECTION", data: {} },
      ]);

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(200);
    });

    it("Should return 403 when accessor has an invalid role", async () => {
      const services = {
        OrganisationService: {
          findUserOrganisations: () => [{ role: "other" }],
        },
      };

      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(services);
      spyOn(validation, "ValidateQueryParams").and.returnValue({});
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: "test_accessor_id",
      });
      spyOn(persistence, "findInnovationSectionByAccessor").and.returnValue([
        { id: "innovation_id" },
      ]);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(403);
    });

    it("Should throw error when oid is different from accessorId", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(dummy.services);
      spyOn(validation, "ValidateQueryParams").and.returnValue({});
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: "test",
      });
      spyOn(persistence, "findInnovationSectionByAccessor").and.returnValue([
        { id: "innovation_id" },
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
    accessorsGetInnovationSection,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "GET",
          "http://nhse-i-aac/api/accessors/{accessorId}/innovations/{innovationId}/sections",
          { ...data.headers }, // headers
          {
            accessorId: "test_accessor_id",
            innovationId: "test_innovation_id",
          }, // ?
          {}, // payload/body
          { section: "SECTION" } // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
