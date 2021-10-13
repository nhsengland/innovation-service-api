/* eslint-disable */
import { UserType } from "@services/index";
import {
  createHttpTrigger, runStubFunctionFromBindings
} from "stub-azure-function-context";
import adminsUpdateUsers from "../../adminsUpdateUsers";
import * as persistence from "../../adminsUpdateUsers/persistence";
import * as validation from "../../adminsUpdateUsers/validation";
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
  adminUser: 'OID'
};

describe("[HttpTrigger] adminsUpdateUsers Suite", () => {
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

    it("Should return 200 when runs without Internal Server Errors", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(null);
      jest.spyOn(validation, "ValidatePayload").mockReturnValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: dummy.adminUser,
      });

      jest.spyOn(persistence, "updateUsers").mockResolvedValue({ userId: ":userId" } as any);
      const OLD_ENV = process.env;
      process.env.ADMIN_OID = dummy.adminUser;

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });

      process.env = OLD_ENV;
      expect(res.status).toBe(200);
    });

    it("Should return 403 when user is not of type ADMIN", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(null);
      jest.spyOn(validation, "ValidatePayload").mockReturnValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: dummy.adminUser,
      });

      const OLD_ENV = process.env;
      process.env.ADMIN_OID = "other";

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });

      process.env = OLD_ENV;
      expect(res.status).toBe(403);
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
          "PATCH",
          "http://nhse-i-aac/api/user-admin/users",
          { ...data.headers },
          {},
          [
            {
              id: 'aaa-bbb-ccc',
              properties: {
                test: 'abc'
              }
            },
          ], // payload/body
          {} // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
