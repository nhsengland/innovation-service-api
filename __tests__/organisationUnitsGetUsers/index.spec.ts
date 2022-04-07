/* eslint-disable */
import {
    createHttpTrigger, runStubFunctionFromBindings
  } from "stub-azure-function-context";
  import organisationUnitsGetUsers from "../../organisationUnitsGetUsers";
  import * as persistence from "../../organisationUnitsGetUsers/persistence";
  import * as authentication from "../../utils/authentication";
  import * as connection from "../../utils/connection";
  import * as service_loader from "../../utils/serviceLoader";
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
          getUser: () => ({
            type: UserType.ADMIN,
            serviceRoles: [{
              role: {
                name: "ADMIN"
              }
            }]
          }),
        },
        AuthService:{
          validate2LS: () => true
      },
      }
    };
  
  describe("[HttpTrigger] organisationUnitsGetUsers Suite", () => {
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
      
          it("Should return 200 when Organisation Unit Users are found", async () => {
            jest.spyOn(authentication, 'decodeToken').mockReturnValue({ oid: ':oid' });
            jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
            jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      
            jest.spyOn(persistence, "findOrganisationUnitUsers").mockResolvedValue([
              { id: '0', name: ':accessor_1', role: ":accessor" },
              { id: '1', name: ':qaccessor_1', role: ":qaccessor" },
            ] as any);

            const { res } = await mockedRequestFactory({
              headers: { authorization: ":access_token" },
            });
            expect(res.status).toBe(200);
          });
      
          it("Should return 500 when an uncontrolled error occurs", async () => {
            jest.spyOn(authentication, 'decodeToken').mockReturnValue({ oid: ':oid' });
            jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
            jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      
            jest.spyOn(persistence, "findOrganisationUnitUsers").mockRejectedValue(
              "Error"
            );
      
            const { res } = await mockedRequestFactory({});
            expect(res.status).toBe(500);
          });
        });
  });
  
  async function mockedRequestFactory(data?: any) {
      return runStubFunctionFromBindings(
        organisationUnitsGetUsers,
        [
          {
            type: "httpTrigger",
            name: "req",
            direction: "in",
            data: createHttpTrigger(
              "GET",
              "http://nhse-i-aac/api/organisations/{organisationUnitId}",
              { ...data.headers }, // headers
              { organisationId: "organisationUnitId" }, // params
              {}, // payload/body
              {} // query params
            ),
          },
          { type: "http", name: "res", direction: "out" },
        ],
        new Date()
      );
  }
  