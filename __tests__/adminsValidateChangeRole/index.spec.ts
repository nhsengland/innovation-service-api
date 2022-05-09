/* eslint-disable */
import { AccessorOrganisationRole, UserType } from "@services/index";
import {
  createHttpTrigger, runStubFunctionFromBindings
} from "stub-azure-function-context";
import adminsUpdateUsers from "../../adminsValidateChangeRole";
import * as persistence from "../../adminsValidateChangeRole/persistence";
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
        type: UserType.ADMIN,
        serviceRoles: [{
          role: {
            name: "ADMIN"
          }
        }]
      }),
      getUserByOptions: () => ({
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

describe("[HttpTrigger] adminsValidateChangeRole Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });
    beforeAll(()=> {
      jest.spyOn(decorators, "AllowedUserType").mockImplementation();
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

    it("Should return 200 when runs without Internal Server Errors", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({ oid: dummy.adminUser });

      jest.spyOn(persistence, "changeRoleValidation").mockResolvedValue({ id: ":userId" } as any);

      const { res } = await mockedRequestFactory({});

      expect(res.status).toBe(200);
    });

    it("Should handle error persistence return error", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: dummy.adminUser,
      });
      jest.spyOn(persistence, "changeRoleValidation").mockRejectedValue(
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
    adminsUpdateUsers,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "GET",
          "http://nhse-i-aac/api/user-admin/users/{userId}/change-role",
          { ...data.headers },
          {
            userId: ":accessor_id"
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
