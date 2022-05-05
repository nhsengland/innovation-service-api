/* eslint-disable */
import { UserType } from "@services/index";
import {
  createHttpTrigger, runStubFunctionFromBindings
} from "stub-azure-function-context";
import assessmentsListInnovations from "../../assessmentsListInnovations";
import * as persistence from "../../assessmentsListInnovations/persistence";
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
    InnovationService: {
      getInnovationListByState: () => ({
        data: [

        ],
        count: 0,
      }),
    },
    UserService: {
      getUser: () => ({
        type: UserType.ASSESSMENT,
      }),
      getUserByOptions: () => ({
        type: UserType.ASSESSMENT,
      }),
    },
  },
};
describe("[HttpTrigger] assessmentsListInnovations Suite", () => {
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
        oid: "C7095D87-C3DF-46F6-A503-001B083F4630",
      });

      jest.spyOn(persistence, "getInnovationList").mockResolvedValue({
        summary: {
          id: ":innovation_id",
          company: ":company_name",
          location: ":company_location",
          description: ":description",
          categories: ["TYPE1", "TYPE2"],
        },
        contact: {
          name: ":display_name",
          email: "user_email@example.com",
          phone: "0351900000000",
        },
      } as any);

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
        oid: "C7095D87-C3DF-46F6-A503-001B083F4630",
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
        oid: "C7095D87-C3DF-46F6-A503-001B083F4630",
      });
      jest.spyOn(persistence, "getInnovationList").mockRejectedValue(
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
    assessmentsListInnovations,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "GET",
          "http://nhse-i-aac/api/assessments/innovations/{innovationId}",
          { ...data.headers }, // headers
          { innovationId: "test_innovation_id" }, // ?
          {}, // payload/body
          { status: 'user_id_1,user_id_2,user_id_3', skip: 0, take: 20 } // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
