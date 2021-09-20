/* eslint-disable */
import { UserType } from "@services/index";
import {
  createHttpTrigger,
  runStubFunctionFromBindings
} from "stub-azure-function-context";
import innovatorsCreateInnovation from "../../innovatorsCreateInnovation";
import * as persistence from "../../innovatorsCreateInnovation/persistence";
import * as validation from "../../innovatorsCreateInnovation/validation";
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
        type: UserType.INNOVATOR,
      }),
    },
  },
  innovationId: "test_innovation_id",
  innovatorId: "test_innovator_id",
};

describe("[HttpTrigger] innovatorsCreateInnovation Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("fails when connection is not established", async () => {
      spyOn(authentication, 'decodeToken').and.returnValue({ oid: ':oid' });
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

    it("Should return 201 when Innovation is created", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(dummy.services);
      spyOn(validation, "ValidatePayload").and.returnValue({});
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: dummy.innovatorId,
      });
      spyOn(persistence, "createInnovation").and.returnValue([
        { id: ":id" },
      ]);

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(201);
    });

    it("Should return 403 when innovator has an invalid user type", async () => {
      const services = {
        UserService: {
          getUser: () => ({
            type: UserType.ACCESSOR,
          }),
        },
      };

      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(services);
      spyOn(validation, "ValidatePayload").and.returnValue({});
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: dummy.innovatorId,
      });
      spyOn(persistence, "createInnovation").and.returnValue([
        { id: ":id" },
      ]);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(403);
    });

    it("Should handle error persistence return error", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(service_loader, "loadAllServices").and.returnValue(dummy.services);
      spyOn(authentication, "decodeToken").and.returnValue({
        oid: dummy.innovatorId,
      });
      spyOn(persistence, "createInnovation").and.throwError(
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
    innovatorsCreateInnovation,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "POST",
          "http://nhse-i-aac/api/innovators/{userId}/innovations",
          { ...data.headers }, // headers
          {
            userId: dummy.innovatorId
          },
          {
            name: ":innovation_name",
            description: ":innovation_desc",
            countryName: 'England',
            organisationShares: []
          }, // payload/body
          null // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
