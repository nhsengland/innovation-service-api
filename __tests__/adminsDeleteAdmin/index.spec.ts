/* eslint-disable */
import { UserType } from "@domain/index";
import {
  createHttpTrigger, runStubFunctionFromBindings
} from "stub-azure-function-context";
import * as mongoose from "mongoose";
import * as adminsDeleteAdmin from "../../adminsDeleteAdmin";
import * as persistence from "../../adminsDeleteAdmin/persistence";
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
      getUserByOptions: () => ({
        type: UserType.ADMIN,
        serviceRoles: [{
          role: {
              name: "ADMIN"
          }
        }]
      }),

    },
    AuthService:{
        validate2LS: () => true
    },
  },
  adminId: "test_admin_id",
};

describe("[HttpTrigger] deleteAdminAccount Test Suite", () => {
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

      it("Should handle error persistence return error", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: "test_accessor_id",
      });
      jest.spyOn(persistence, "deleteAdminAccount").mockRejectedValue(
        "Error."
      );

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(500);
    });

    it("Should return 200 when delete account return no error ", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: "test_admin_id",
      });
      jest.spyOn(mongoose, "connect").mockResolvedValue(null);
      jest.spyOn(persistence, "deleteAdminAccount").mockResolvedValue([
    ] as any);

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(200);
    });


  });
});

async function mockedRequestFactory(data?: any) {
  return runStubFunctionFromBindings(
    adminsDeleteAdmin.default,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "PATCH",
          "http://nhse-i-aac/api/user-admin/{userId}/delete",
          { ...data.headers }, // headers
          { userId: "userId"},
          {}, // payload/body
          {} // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
