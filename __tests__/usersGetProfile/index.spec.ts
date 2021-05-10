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

describe("[HttpTrigger] usersGetProfile Test Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("fails when connection is not established", async () => {
      spyOn(connection, "setupSQLConnection").and.throwError(
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
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(null);
      spyOn(validation, "ValidateHeaders").and.returnValue({
        error: "missing authorization header",
      });
      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(422);
    });

    it("Should return 200 when User Profile is found", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(null);
      spyOn(validation, "ValidateHeaders").and.returnValue({});
      spyOn(persistence, "getProfile").and.returnValue([
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
      ]);

      spyOn(decodejwt, "decodeToken").and.returnValue({
        oid: ":user_oid",
      });

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(200);
    });

    it("Should return 404 when User Profile is not found", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(null);
      spyOn(validation, "ValidateHeaders").and.returnValue({});
      spyOn(persistence, "getProfile").and.returnValue(null);

      spyOn(decodejwt, "decodeToken").and.returnValue({
        oid: ":user_oid",
      });

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(404);
    });

    it("Should return 500 when User Profile fetch fails", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(null);
      spyOn(validation, "ValidateHeaders").and.returnValue({});
      spyOn(persistence, "getProfile").and.throwError("");

      spyOn(decodejwt, "decodeToken").and.returnValue({
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
