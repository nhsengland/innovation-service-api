/* eslint-disable */
import { UserType } from "@services/index";
import {
  createHttpTrigger, runStubFunctionFromBindings
} from "stub-azure-function-context";
import adminsSearchOrganisationByAcronym from "../../adminsHeadOrganisationAcronym";
import * as persistence from "../../adminsHeadOrganisationAcronym/persistence";
import * as validation from "../../adminsHeadOrganisationAcronym/validation";
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
        type: UserType.ADMIN,
        serviceRoles: [{
          role: {
            name: "ADMIN"
          }
        }]
      }),
    },
  },
  adminUser: 'test_admin_oid'
};

describe("[HttpTrigger] adminsHeadOrganisationAcronym Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("fails when connection is not established", async () => {
      jest.spyOn(authentication, "decodeToken").mockReturnValue({ oid: ":oid" });
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

    it("Should return 200 when acronym is valid", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(validation, "ValidateQuerySchema").mockReturnValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({ oid: dummy.adminUser });

      jest.spyOn(persistence, "searchOrganisationByAcronym").mockResolvedValue([
        { 
            acronym: "acronym",
            id: "organisationId",
        },
    ] as any);

      const { res } = await mockedRequestFactory({});

      expect(res.status).toBe(200);
    });

    it("Should handle error persistence return error", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: dummy.adminUser,
      });
      jest.spyOn(persistence, "searchOrganisationByAcronym").mockRejectedValue(
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
    adminsSearchOrganisationByAcronym,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "HEAD",
          "http://nhse-i-aac/api/user-admin/organisation-acronym",
          { ...data.headers }, // headers
          {},
          {}, // payload/body
          { 
              acronym: "acronym",
              organisationId: "organisationId",
         }, // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
