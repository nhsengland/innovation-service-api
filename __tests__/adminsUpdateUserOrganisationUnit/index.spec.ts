/* eslint-disable */
import * as mongoose from "mongoose";
import { AccessorOrganisationRole, UserType } from "@services/index";
import {
    createHttpTrigger, runStubFunctionFromBindings
} from "stub-azure-function-context";
import adminsUpdateUserOrganisationUnit from "../../adminsUpdateUserOrganisationUnit";
import * as persistence from "../../adminsUpdateUserOrganisationUnit/persistence";
import * as validation from "../../adminsUpdateUserOrganisationUnit/validation";
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
                type: UserType.ADMIN,
                serviceRoles: [{
                    role: {
                        name: "ADMIN"
                    }
                }]
            }),
            getUserByOptions: () => ({
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
    },
    adminUser: 'test_admin_oid',
};

describe("[HttpTrigger] adminsUpdateUserOrganisationUnit Suite", () => {
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

        it("Should return 200 when Organisation Unit is updated", async () => {
            jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
            jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
            jest.spyOn(validation, "ValidatePayload").mockReturnValue({} as any);
            jest.spyOn(mongoose, "connect").mockResolvedValue(null);
            jest.spyOn(authentication, "decodeToken").mockReturnValue({ oid: dummy.adminUser });

            jest.spyOn(persistence, "updateUserOrganisationUnit").mockResolvedValue([
                {
                    userId: "userId",
                    newOrganisationUnitAcronym: "acronym",
                    organisationId: "organisationId",
                },
            ] as any);

            const { res } = await mockedRequestFactory({});

            expect(res.status).toBe(200);
        });

        it("Should handle error persistence return error", async () => {
            jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
            jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
            jest.spyOn(authentication, "decodeToken").mockReturnValue({
                oid: dummy.adminUser,
            });
            jest.spyOn(persistence, "updateUserOrganisationUnit").mockRejectedValue(
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
        adminsUpdateUserOrganisationUnit,
        [
            {
                type: "httpTrigger",
                name: "req",
                direction: "in",
                data: createHttpTrigger(
                    "PATCH",
                    "http://nhse-i-aac/api/user-admin/users/{userId}/change-unit",
                    { ...data.headers }, // headers
                    { userId: "userId", },
                    {
                    newOrganisationUnitAcronym: "acronym",
                    organisationId: "organisationId",
                    }, // payload/body
                    {}, // querystring
                ),
            },
            { type: "http", name: "res", direction: "out" },
        ],
        new Date()
    );
}
