/* eslint-disable */
import { AccessorOrganisationRole } from "@services/index";
import {
  createHttpTrigger,
  runStubFunctionFromBindings
} from "stub-azure-function-context";
import accessorsCreateInnovationComment from "../../accessorsCreateInnovationComment";
import * as persistence from "../../accessorsCreateInnovationComment/persistence";
import * as validation from "../../accessorsCreateInnovationComment/validation";
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
  innovationId: "test_innovation_id",
  accessorId: "test_accessor_id",
};

describe("[HttpTrigger] accessorsCreateInnovationComment Suite", () => {
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

    it("Should return 201 when Innovation Comment is created", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(validation, "ValidatePayload").mockResolvedValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockResolvedValue({
        oid: dummy.accessorId,
      });
      jest.spyOn(persistence, "createInnovationComment").mockResolvedValue([
        { id: "comment_id" },
      ] as any);

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(201);
    });

    it("Should return 403 when accessor has an invalid role", async () => {
      const services = {
        OrganisationService: {
          findUserOrganisations: () => [{ role: "other" }],
        },
      };

      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(services as any);
      jest.spyOn(validation, "ValidatePayload").mockResolvedValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockResolvedValue({
        oid: dummy.accessorId,
      });
      jest.spyOn(persistence, "createInnovationComment").mockResolvedValue([
        { id: "comment_id" },
      ] as any);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(403);
    });

    it("Should throw error when oid is different from accessorId", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(validation, "ValidatePayload").mockResolvedValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockResolvedValue({
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
      jest.spyOn(authentication, "decodeToken").mockResolvedValue({
        oid: dummy.accessorId,
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
    accessorsCreateInnovationComment,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "POST",
          "http://nhse-i-aac/api/accessors/{userId}/innovations/{innovationId}/comments",
          { ...data.headers }, // headers
          {
            userId: dummy.accessorId,
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
