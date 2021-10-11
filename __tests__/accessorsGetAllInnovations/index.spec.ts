/* eslint-disable */
import { AccessorOrganisationRole, InnovationStatus } from "@services/index";
import {
  createHttpTrigger, runStubFunctionFromBindings
} from "stub-azure-function-context";
import accessorsGetAllInnovations from "../../accessorsGetAllInnovations";
import * as persistence from "../../accessorsGetAllInnovations/persistence";
import * as validation from "../../accessorsGetAllInnovations/validation";
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
};

describe("[HttpTrigger] accessorsGetAllInnovations Suite", () => {
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

    it("Should return 200 when Innovations is found", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(validation, "ValidateQueryParams").mockResolvedValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockResolvedValue({
        oid: "test_accessor_id",
      });
      jest.spyOn(persistence, "findAllInnovationsByAccessor").mockResolvedValue([
        [
          {
            id: "innovation_id",
            description: "description",
            status: InnovationStatus.WAITING_NEEDS_ASSESSMENT,
            assessments: [
              {
                id: ':assessment_a'
              },
              {
                id: ':assessment_b'
              }
            ]
          },
        ],
        1,
      ] as any);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(200);
    });

    it("Should return 403 when accessor has an invalid role", async () => {
      const services = {
        OrganisationService: {
          findUserOrganisations: () => [
            { role: 'OTHER' },
          ],
        },
      };

      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(services as any);
      jest.spyOn(validation, "ValidateQueryParams").mockResolvedValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockResolvedValue({
        oid: "test_accessor_id",
      });
      jest.spyOn(persistence, "findAllInnovationsByAccessor").mockResolvedValue([
        { id: "innovation_id" },
      ] as any);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(403);
    });

    it("Should throw error when oid is different from accessorId", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(validation, "ValidateQueryParams").mockResolvedValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockResolvedValue({
        oid: "test",
      });
      jest.spyOn(persistence, "findAllInnovationsByAccessor").mockResolvedValue([
        { id: "innovation_id" },
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
        oid: "test_accessor_id",
      });
      jest.spyOn(persistence, "findAllInnovationsByAccessor").mockRejectedValue(
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
    accessorsGetAllInnovations,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "GET",
          "http://nhse-i-aac/api/accessors/{userId}/accessors",
          { ...data.headers }, // headers
          { userId: "test_accessor_id" }, // ?
          {}, // payload/body
          {
            take: 10,
            skip: 0,
            supportStatus: 'ENGAGING',
            assignedToMe: 'true',
            order: '{"name": "asc"}'
          } // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
