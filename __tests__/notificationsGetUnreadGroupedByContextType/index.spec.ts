/* eslint-disable */
import * as persistence from "../../notificationsGetUnreadGroupedByContextType/persistence";
import notificationsGetUnreadGroupedByContext from '../../notificationsGetUnreadGroupedByContextType'
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
        type: UserType.ASSESSMENT,
      }),
    },
  },
}
describe("[HttpTrigger] notificationsGetUnreadGroupedByContext Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("fails when connection is not established", async () => {
      jest.spyOn(authentication, 'decodeToken').mockReturnValue({oid: ':oid'});
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

    it("Should return 200 and notifications object", async () => {

      jest.spyOn(authentication, 'decodeToken').mockReturnValue({oid: ':oid'});
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);


      jest.spyOn(persistence, "getAllUnreadNotificationsCounts").mockResolvedValue({ INNOVATION: 1, ACTION: 1, DATA_SHARING: 1, SUPPORT: 2, COMMENT: 4});

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(200);
      expect(Object.keys(res.body).length).toBe(5)
    });

    it("Should return 200 and an empty object when no unread notifications exist", async () => {
      jest.spyOn(authentication, 'decodeToken').mockReturnValue({oid: ':oid'});
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);

      jest.spyOn(persistence, "getAllUnreadNotificationsCounts").mockResolvedValue({ });

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(200);
      expect(res.body).toEqual({});
    });
  });
});

async function mockedRequestFactory(data?: any) {
  return runStubFunctionFromBindings(
    notificationsGetUnreadGroupedByContext,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "GET",
          "http://nhse-i-aac/api/notifications/context",
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
