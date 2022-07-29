/* eslint-disable */
import { NotificationPreferenceType } from "@domain/index";
import { UserType } from "@services/index";
import {
  createHttpTrigger, runStubFunctionFromBindings
} from "stub-azure-function-context";
import notificationsUpdatePreferences from '../../notificationsUpdatePreference';
import * as persistence from "../../notificationsUpdatePreference/persistence";
import * as authentication from "../../utils/authentication";
import * as connection from "../../utils/connection";
import * as decorators from "../../utils/decorators";
import * as service_loader from "../../utils/serviceLoader";


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
      getUserByOptions: () => ({
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
    beforeAll(()=> {
      jest.spyOn(decorators, "AllowedUserType").mockImplementation();
    });

    it("fails when connection is not established", async () => {
      jest.spyOn(authentication, 'decodeToken').mockResolvedValue({oid: ':oid'});
      jest.spyOn(connection, "setupSQLConnection").mockRejectedValue(
        new Error("Error establishing connection with the datasource.")
      );

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(500);
      expect(res.body.error).toBeDefined();
      expect(res.body.error).toBe(
        "Error establishing connection with the datasource."
      );
    });

    it("Should return 200 and update user notification preferences", async () => {

      jest.spyOn(authentication, 'decodeToken').mockReturnValue({oid: ':oid'});
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);

      jest.spyOn(persistence, "updateEmailNotificationPreferences").mockResolvedValue([
          { notificationType: "NotificationType" , status: "OK"}
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
              preference: NotificationPreferenceType.NEVER
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
