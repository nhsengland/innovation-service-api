/* eslint-disable */
import { UserType } from "@domain/index";
import {
  createHttpTrigger, runStubFunctionFromBindings
} from "stub-azure-function-context";
import * as usersUpdateProfile from "../../usersUpdateProfile";
import * as persistence from "../../usersUpdateProfile/persistence";
import * as validation from "../../usersUpdateProfile/validation";
import * as authentication from "../../utils/authentication";
import * as decodejwt from "../../utils/authentication";
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
        type: UserType.INNOVATOR,
      }),
    },
  }
};

describe("[HttpTrigger] usersUpdateProfile Test Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("fails when connection is not established", async () => {
      jest.spyOn(decodejwt, 'decodeToken').mockResolvedValue({ oid: ':oid' });
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

    it("Should return 403 when innovator has an invalid user type", async () => {
      const services = {
        UserService: {
          getUser: () => ({
            type: UserType.ADMIN,
          }),
        },
      };

      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(services as any);
      jest.spyOn(validation, "ValidatePayload").mockResolvedValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockResolvedValue({
        oid: "test_innovator_id",
      });
      jest.spyOn(persistence, "updateProfile").mockResolvedValue([
        { id: ":id" },
      ] as any);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(403);
    });

    it("Should return 200 when User Profile is found", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(validation, "ValidatePayload").mockResolvedValue({} as any);
      jest.spyOn(persistence, "updateProfile").mockResolvedValue({ id: ":user_oid" });

      jest.spyOn(decodejwt, "decodeToken").mockResolvedValue({
        oid: ":user_oid",
      });

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(200);
    });

    it("Should return 500 when User Update fails", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(validation, "ValidatePayload").mockResolvedValue({} as any);
      jest.spyOn(persistence, "updateProfile").mockRejectedValue("");

      jest.spyOn(decodejwt, "decodeToken").mockResolvedValue({
        oid: ":user_oid",
      });

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(500);
    });
  });
});

async function mockedRequestFactory(data?: any) {
  return runStubFunctionFromBindings(
    usersUpdateProfile.default,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "PUT",
          "http://nhse-i-aac/api/me",
          { ...data.headers }, // headers
          {},
          { displayName: ":displayName" }, // payload/body
          undefined // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
