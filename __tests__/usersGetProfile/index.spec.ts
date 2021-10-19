/* eslint-disable */
import * as persistence from "../../usersGetProfile/persistence";
import * as usersGetProfile from "../../usersGetProfile";
import * as connection from "../../utils/connection";
import * as validation from "../../usersGetProfile/validation";
import * as decodejwt from "../../utils/authentication";
import * as service_loader from "../../utils/serviceLoader";

import {
  runStubFunctionFromBindings,
  createHttpTrigger,
} from "stub-azure-function-context";
import { UserType } from "@domain/index";

jest.mock("../../utils/logging/insights", () => ({
  start: () => {},
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
      trackTrace: () => {},
      trackRequest: () => {},
      flush: () => {},
    },
  }),
}));

describe("[HttpTrigger] usersGetProfile Test Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("fails when connection is not established", async () => {
      jest.spyOn(decodejwt, 'decodeToken').mockResolvedValue({oid: ':oid'});
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

    it("fails on missing authorization header", async () => {
      jest.spyOn(decodejwt, 'decodeToken').mockResolvedValue({oid: ':oid'});
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(null);
      jest.spyOn(validation, "ValidateHeaders").mockResolvedValue({
        error: "missing authorization header",
      });
      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(422);
    });

    it("Should return 200 when User Profile is found", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(null);
      jest.spyOn(validation, "ValidateHeaders").mockResolvedValue({} as any);
      jest.spyOn(persistence, "getProfile").mockResolvedValue([
        {
          id: ":user_oid",
          displayName: ":test_user",
          type: UserType.INNOVATOR,
          organisations: [
            {
              id: ":org_id",
              name: ":org_name",
              role: "OWNER",
            },
          ],
        },
      ] as any);

      jest.spyOn(decodejwt, "decodeToken").mockResolvedValue({
        oid: ":user_oid",
      });

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(200);
    });

    it("Should return 404 when User Profile is not found", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(null);
      jest.spyOn(validation, "ValidateHeaders").mockResolvedValue({} as any);
      jest.spyOn(persistence, "getProfile").mockResolvedValue(null);

      jest.spyOn(decodejwt, "decodeToken").mockResolvedValue({
        oid: ":user_oid",
      });

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(404);
    });

    it("Should return 500 when User Profile fetch fails", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(null);
      jest.spyOn(validation, "ValidateHeaders").mockResolvedValue({} as any);
      jest.spyOn(persistence, "getProfile").mockRejectedValue("");

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
    usersGetProfile.default,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "HEAD",
          "http://nhse-i-aac/api/me",
          { ...data.headers }, // headers
          { innovatorId: "test_innovator_id" }, // ?
          {}, // payload/body
          undefined // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
