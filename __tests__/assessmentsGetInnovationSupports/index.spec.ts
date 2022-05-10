/* eslint-disable */
import { AccessorOrganisationRole, InnovatorOrganisationRole, UserType } from "@services/index";
import {
  createHttpTrigger,
  runStubFunctionFromBindings
} from "stub-azure-function-context";
// import accessorsGetInnovationSupports from "../../accessorsGetInnovationSupports";
// import * as persistence from "../../accessorsGetInnovationSupports/persistence";
import assessmentsGetInnovationSupports from "../../assessmentsGetInnovationSupports";
import * as persistence from "../../assessmentsGetInnovationSupports/persistence";
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
    // OrganisationService: {
    //   findUserOrganisations: () => [
    //     { role: AccessorOrganisationRole.QUALIFYING_ACCESSOR, organisation: { id: ':orgId' } },
    //   ],
    // },
  },
  innovationId: "test_innovation_id",
  // accessorId: "test_accessor_id"
  assessmentUserId: "test_assessment_user_id"
};

describe("[HttpTrigger] accessorsGetInnovationSupports Suite", () => {
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

    it("Should return 200 when get Innovation Supports", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: dummy.assessmentUserId,
      });
      jest.spyOn(persistence, "findAllInnovationSupports").mockResolvedValue(
        { id: "innovation_id" } as any,
      );

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(200);
    });

    it.skip("Should throw error when oid is different from innovatorId", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: "test",
      });
      jest.spyOn(persistence, "findAllInnovationSupports").mockResolvedValue([
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
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: dummy.assessmentUserId,
      });
      jest.spyOn(persistence, "findAllInnovationSupports").mockRejectedValue(
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
    assessmentsGetInnovationSupports,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "GET",
          "http://nhse-i-aac/api/assessments/{userId}/innovations/{innovationId}/supports",
          { ...data.headers }, // headers
          {
            // userId: dummy.accessorId,
            userId: dummy.assessmentUserId,
            innovationId: dummy.innovationId
          },
          null, // payload/body
          {} // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
