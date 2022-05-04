/* eslint-disable */
import { Activity, ActivityType } from "@domain/index";
import { UserType } from "@services/index";
import {
  createHttpTrigger, runStubFunctionFromBindings
} from "stub-azure-function-context";
import assessmentsGetInnovationActivities from "../../assessmentsGetInnovationActivities";
import * as persistence from "../../assessmentsGetInnovationActivities/persistence";
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
        type: UserType.ASSESSMENT,
      }),
      getUserByOptions: () => ({
        type: UserType.ASSESSMENT,
      })
    },
  },
};
describe("[HttpTrigger] assessmentsGetInnovationActivities Suite", () => {
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

    it("Should return 200 when Innovation is found", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: "test_assessment_oid",
      });

      jest.spyOn(persistence, "getInnovationActivitiesById").mockResolvedValue([
        [
          {
            id: "activity_id",
            type: ActivityType.ACTIONS,
            activity: Activity.ACTION_CREATION,
            params:
              {
                id: ':value'
              }
          },
        ],
        1,
      ] as any);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });

      expect(res.status).toBe(200);
    });

    it("Should return 403 when user is not of type ASSESSMENT", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      const modifiedServices = {
        ...dummy.services,
        UserService: {
          getUser: () => ({
            type: UserType.ACCESSOR,
          }),
          getUserByOptions: () => ({
            type: UserType.ACCESSOR,
          }),
        },
      };
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(
        modifiedServices as any
      );
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: "test_assessment_oid",
      });

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });

      expect(res.status).toBe(403);
    });

    it("Should handle error persistence return error", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: "test_assessment_oid",
      });
      jest.spyOn(persistence, "getInnovationActivitiesById").mockRejectedValue(
        "Error."
      );

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(500);
    });
  });
});

async function mockedRequestFactory(data?: any) {
  return runStubFunctionFromBindings(
    assessmentsGetInnovationActivities,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "GET",
          "http://nhse-i-aac/api/assessments/{userId}/innovations/{innovationId}/activities",
          { ...data.headers }, // headers
          { innovationId: "test_innovation_id" }, // ?
          {}, // payload/body
          {
            take: 10,
            skip: 0,
            order: '{"createdAt": "asc"}'
          } // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
