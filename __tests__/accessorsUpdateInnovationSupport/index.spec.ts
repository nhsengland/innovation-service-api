/* eslint-disable */
import { AccessorOrganisationRole } from "@services/index";
import { createHttpTrigger, runStubFunctionFromBindings } from "stub-azure-function-context";
import accessorsUpdateInnovationSupport from "../../accessorsUpdateInnovationSupport";
import * as persistence from "../../accessorsUpdateInnovationSupport/persistence";
import * as validation from "../../accessorsUpdateInnovationSupport/validation";
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
        { role: AccessorOrganisationRole.QUALIFYING_ACCESSOR, organisation: { id: ':orgId' } },
      ],
    },
  },
  supportId: "test_support_id",
  innovationId: "test_innovation_id",
  accessorId: "test_accessor_id",
};

describe("[HttpTrigger] accessorsUpdateInnovationSupport Suite", () => {
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

    it("Should return 200 when Innovation Support is updated", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(validation, "ValidatePayload").mockReturnValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: dummy.accessorId,
      });
      jest.spyOn(persistence, "updateInnovationSupport").mockResolvedValue([
        { id: dummy.supportId },
      ] as any);

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(200);
    });

    it("Should return 403 when accessor has an invalid role", async () => {
      const services = {
        OrganisationService: {
          findUserOrganisations: () => [{ role: "other" }],
        },
      };

      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(services as any);
      jest.spyOn(validation, "ValidatePayload").mockReturnValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: dummy.accessorId,
      });
      jest.spyOn(persistence, "updateInnovationSupport").mockResolvedValue([
        { id: dummy.supportId },
      ] as any);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(403);
    });

    it("Should throw error when oid is different from accessorId", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(validation, "ValidatePayload").mockReturnValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: "other",
      });
      jest.spyOn(persistence, "updateInnovationSupport").mockResolvedValue([
        { id: dummy.supportId },
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
        oid: dummy.accessorId,
      });
      jest.spyOn(persistence, "updateInnovationSupport").mockRejectedValue(
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
    accessorsUpdateInnovationSupport,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "PUT",
          "http://nhse-i-aac/api/accessors/{userId}/innovations/{innovationId}/supports/{supportId}",
          { ...data.headers }, // headers
          {
            supportId: dummy.supportId,
            userId: dummy.accessorId,
            innovationId: dummy.innovationId,
          },
          {
            status: "NOT_YET",
            comment: ":comment",
            accessors: [],
          }, // payload/body
          null // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
