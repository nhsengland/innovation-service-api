/* eslint-disable */
import * as persistence from "../../notificationsPatchDismiss/persistence";
import notificationsPatchDismiss from '../../notificationsPatchDismiss'
import * as connection from "../../utils/connection";
import * as service_loader from "../../utils/serviceLoader";
import * as decorators from "../../utils/decorators";
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
      getUserByOptions: () => ({
        type: UserType.ASSESSMENT,
      }),
    },
  },
}
describe("[HttpTrigger] notificationPatchDismiss Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });
    beforeAll(()=> {
      jest.spyOn(decorators, "AllowedUserType").mockImplementation();
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

    it("Should return 200", async () => {

      jest.spyOn(authentication, 'decodeToken').mockReturnValue({oid: ':oid'});
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);


      jest.spyOn(persistence, "patchDismissNotification").mockResolvedValue({} as any);

      const { res } = await mockedRequestFactory({body :{
        context: {
          id:'886554E4-83B6-EC11-997E-0050F25A43BD',
          type: ':contextType'
        }
      }});
      expect(res.status).toBe(200);
    });
  });
});

async function mockedRequestFactory(data?: any) {
  return runStubFunctionFromBindings(
    notificationsPatchDismiss,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "PATCH",
          "http://nhse-i-aac/api/notifications/dismiss",
          { ...data.headers }, // headers
          {}, // params
          {...data.body}, // payload/body
          {} // query params
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
