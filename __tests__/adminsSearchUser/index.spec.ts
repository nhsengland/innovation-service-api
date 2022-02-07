/* eslint-disable */
import { UserType } from "@services/index";
import {
  createHttpTrigger, runStubFunctionFromBindings
} from "stub-azure-function-context";
import adminsSearchUser from "../../adminsSearchUser";
import * as persistence from "../../adminsSearchUser/persistence";
import * as validation from "../../adminsSearchUser/validation";
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
      }),
    },
  },
  adminUser: 'OID'
};

describe("[HttpTrigger] adminsSearchUser Suite", () => {
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

    // it("Should return 200 when runs without Internal Server Errors", async () => {
    //   jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
    //   jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(null);
    //   jest.spyOn(validation, "ValidateQuerySchema").mockReturnValue({} as any);
    //   jest.spyOn(authentication, "decodeToken").mockReturnValue({
    //     oid: dummy.adminUser,
    //   });

    //   jest.spyOn(persistence, "searchUserByEmail").mockResolvedValue({ userId: ":userId" } as any);

    //   const { res } = await mockedRequestFactory({});

    //   expect(res.status).toBe(200);
    // });

    // it("Should return 403 when user is not of type ADMIN", async () => {
    //   jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
    //   jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(null);
    //   jest.spyOn(validation, "ValidateQuerySchema").mockReturnValue({} as any);
    //   jest.spyOn(authentication, "decodeToken").mockReturnValue({
    //     oid: dummy.adminUser,
    //   });

    //   const { res } = await mockedRequestFactory({
    //     headers: { authorization: ":access_token" },
    //   });

    //   expect(res.status).toBe(403);
    // });
  });
});

async function mockedRequestFactory(data?: any) {
  return runStubFunctionFromBindings(
    adminsSearchUser,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "HEAD",
          "http://nhse-i-aac/api/user-admin/user",
          { ...data.headers },
          {},
          {}, // payload/body
          { email: "email@aaa.com" } // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
