/* eslint-disable */
import { Activity, ActivityType, UserType } from "@domain/index";
import { AccessorOrganisationRole } from "@services/index";
import {
  createHttpTrigger, runStubFunctionFromBindings
} from "stub-azure-function-context";
import accessorsGetInnovationActivities from "../../accessorsGetInnovationActivities";
import * as persistence from "../../accessorsGetInnovationActivities/persistence";
import * as authentication from "../../utils/authentication";
import * as connection from "../../utils/connection";
import * as service_loader from "../../utils/serviceLoader";
import * as decorators from "../../utils/decorators";


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
    OrganisationService: {
      findUserOrganisations: () => [
        { role: AccessorOrganisationRole.QUALIFYING_ACCESSOR, organisation: { id: ':orgId' } },
      ],
    },
    UserService: {
      getUserByOptions: () => ({ type: UserType.ACCESSOR }),
    }
  },
};

describe("[HttpTrigger] accessorsGetInnovationActivities Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });
    beforeAll(()=> {
      jest.spyOn(decorators, "AllowedUserType").mockImplementation();
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

    it("Should return 200 when Innovation Activity is found", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: ":accessor_id",
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

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(200);
    });

    it("Should return 403 when accessor has an invalid role", async () => {
      const services = {
        OrganisationService: {
          findUserOrganisations: () => [{ id: ":id", organisation: { id: ":id", name: ":name" }, role: "other" }],
        },
        UserService: {
          getUserByOptions: () => ({ type: UserType.ACCESSOR }),
        }
      };

      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(services as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: "test_accessor_id",
      });
      jest.spyOn(persistence, "getInnovationActivitiesById").mockResolvedValue([
        { id: "activity_id" },
      ] as any);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(403);
    });

    it.skip("Should throw error when oid is different from accessorId", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: "test",
      });
      jest.spyOn(persistence, "getInnovationActivitiesById").mockResolvedValue([
        { id: "activity_id" },
      ] as any);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(403);
    });

    it("Should handle error persistence return error", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: ":accessor_id",
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
    accessorsGetInnovationActivities,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "GET",
          "http://nhse-i-aac/api/accessors/{userId}/innovations/{innovationId}/activities",
          { ...data.headers }, // headers
          {
            userId: ":accessor_id",
            innovationId: ":innovation_id",
          }, // pathparams
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
