/* eslint-disable */
import {
  createHttpTrigger, runStubFunctionFromBindings
} from "stub-azure-function-context";
import termsOfUseCheckIfUserAccepted from "../../termsOfUseCheckIfUserAccepted";
import * as persistence from "../../termsOfUseCheckIfUserAccepted/persistence";
import * as authentication from "../../utils/authentication";
import * as connection from "../../utils/connection";
import * as service_loader from "../../utils/serviceLoader";
import * as decorators from "../../utils/decorators";
import { UserType } from "@domain/index";

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
        getUserByOptions: () => ({
          type: UserType.INNOVATOR,
        }),
      },
    }
  };

describe("[HttpTrigger] termsOfUseCheckIfUserAccepted Suite", () => {
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

        it("Should return 200 when Terms of Use is found", async () => {
          jest.spyOn(authentication, 'decodeToken').mockReturnValue({ oid: ':oid' });
          jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
          jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);

          jest.spyOn(persistence, "termsOfUseCheckIfUserAccepted").mockResolvedValue([
            { },
          ] as any);

          const { res } = await mockedRequestFactory({});
          expect(res.status).toBe(200);
        });

        it("Should return 500 when an uncontrolled error occurs", async () => {
          jest.spyOn(authentication, 'decodeToken').mockReturnValue({ oid: ':oid' });
          jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
          jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);

          jest.spyOn(persistence, "termsOfUseCheckIfUserAccepted").mockRejectedValue(
            "Error"
          );

          const { res } = await mockedRequestFactory({});
          expect(res.status).toBe(500);
        });
      });
});

async function mockedRequestFactory(data?: any) {
    return runStubFunctionFromBindings(
      termsOfUseCheckIfUserAccepted,
      [
        {
          type: "httpTrigger",
          name: "req",
          direction: "in",
          data: createHttpTrigger(
            "GET",
            "http://nhse-i-aac/api/tou/me",
            { ...data.headers }, // headers
            {}, // params
            {}, // payload/body
            {} // query params
          ),
        },
        { type: "http", name: "res", direction: "out" },
      ],
      new Date()
    );
}
