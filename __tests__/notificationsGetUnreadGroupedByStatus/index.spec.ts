/* eslint-disable */
import * as persistence from "../../notificationsGetUnreadGroupedByStatus/persistence";
import notificationsGetUnreadGroupedByStatus from '../../notificationsGetUnreadGroupedByStatus'
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
describe("[HttpTrigger] notificationsGetUnreadGroupedByStatus Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("fails when connection is not established", async () => {
      spyOn(authentication, 'decodeToken').and.returnValue({oid: ':oid'});
      spyOn(connection, "setupSQLConnection").and.throwError(
        "Error establishing connection with the datasource."
      );

      const { res } = await mockedRequestFactory({query: { scope: 'SUPPORT_STATUS' } });
      expect(res.status).toBe(500);
      expect(res.body.error).toBeDefined();
      expect(res.body.error).toBe(
        "Error establishing connection with the datasource."
      );
    });

    it("Should return 422 when scope querystring is missing", async () => {

      spyOn(authentication, 'decodeToken').and.returnValue({oid: ':oid'});
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(dummy.services);


      spyOn(persistence, "getNotificationsGroupedByStatus").and.returnValue({});

      const { res } = await mockedRequestFactory({ });
      expect(res.status).toBe(422);
    });
    it("Should return 200 and notifications object with SUPPORT_STATUS scope", async () => {

      spyOn(authentication, 'decodeToken').and.returnValue({oid: ':oid'});
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(dummy.services);


      spyOn(persistence, "getNotificationsGroupedByStatus").and.returnValue({ ENGAGING: 1, COMPLETE: 1});

      const { res } = await mockedRequestFactory({query: {scope: 'SUPPORT_STATUS' } });
      expect(res.status).toBe(200);
      expect(Object.keys(res.body).length).toBe(2)
    });

    it("Should return 200 and notifications object with INNOVATION_STATUS scope", async () => {

      spyOn(authentication, 'decodeToken').and.returnValue({oid: ':oid'});
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(dummy.services);


      spyOn(persistence, "getNotificationsGroupedByStatus").and.returnValue({ UNASSIGNED: 1, IN_PROGRESS: 1, NEED_ASSESSMENT: 5});

      const { res } = await mockedRequestFactory({query: {scope: 'INNOVATION_STATUS' } });
      expect(res.status).toBe(200);
      expect(Object.keys(res.body).length).toBe(3)
    });

    it("Should return 422 when scope is not SUPPORT_STATUS or INNOVATION_STATUS", async () => {

      spyOn(authentication, 'decodeToken').and.returnValue({oid: ':oid'});
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(dummy.services);


      spyOn(persistence, "getNotificationsGroupedByStatus").and.returnValue({ });

      const { res } = await mockedRequestFactory({query: {scope: 'some_random_scope' } });
      expect(res.status).toBe(422);
    });
  });
});

async function mockedRequestFactory(data?: any) {
  return runStubFunctionFromBindings(
    notificationsGetUnreadGroupedByStatus,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "GET",
          "http://nhse-i-aac/api/notifications/status",
          { ...data.headers }, // headers
          {}, // params
          {}, // payload/body
          { ...data.query} // query params
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
