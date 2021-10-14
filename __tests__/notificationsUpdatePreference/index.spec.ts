/* eslint-disable */
import * as persistence from "../../notificationsUpdatePreference/persistence";
import notificationsUpdatePreferences from '../../notificationsUpdatePreference'
import * as connection from "../../utils/connection";
import * as service_loader from "../../utils/serviceLoader";
import * as authentication from "../../utils/authentication";

import {
  runStubFunctionFromBindings,
  createHttpTrigger,
} from "stub-azure-function-context";
import { UserType } from "@services/index";

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
const dummy = {
  services: {
    UserService: {
      getUser: () => ({
        type: UserType.INNOVATOR,
      }),
    },
  },
}
describe("[HttpTrigger] notificationsUpdatePreferences Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("fails when connection is not established", async () => {
      spyOn(authentication, 'decodeToken').and.returnValue({oid: ':oid'});
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

    it("Should return 200 and update user notification preferences", async () => {

      spyOn(authentication, 'decodeToken').and.returnValue({oid: ':oid'});
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(dummy.services);

      spyOn(persistence, "updateEmailNotificationPreferences").and.returnValue([
          { id: "NotificationType" , status: "OK"}
        ]);

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(200);
    });
  });
});

async function mockedRequestFactory(data?: any) {
  return runStubFunctionFromBindings(
    notificationsUpdatePreferences,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "PUT",
          "http://nhse-i-aac/api/email-notifications",
          { ...data.headers }, // headers
          {}, // params
          [
            {
              notificationType: 'notification-type',
              isSubscribed: 'true'
            },
          ], // payload/body
          {} // query params
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
