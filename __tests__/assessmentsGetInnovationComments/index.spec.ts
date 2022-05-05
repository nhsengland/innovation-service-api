/* eslint-disable */
import { UserType } from "@services/index";
import {
    createHttpTrigger, runStubFunctionFromBindings
} from "stub-azure-function-context";
import assessmentsGetInnovationComments from "../../assessmentsGetInnovationComments";
import * as persistence from "../../assessmentsGetInnovationComments/persistence";
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
            }),
        }
    },
};

describe("[HttpTrigger] assessmentsGetInnovationComments Suite", () => {
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

        it("Should return 200 when Innovation Comments is found", async () => {
            jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
            jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
            jest.spyOn(authentication, "decodeToken").mockReturnValue({
                oid: ":assessment_user_id",
              });
            jest.spyOn(persistence, "findInnovationComments").mockResolvedValue([
                { id: ":comment_id" } as any,
            ]);

            const { res } = await mockedRequestFactory({});
            expect(res.status).toBe(200);
        });

        it("Should throw error when oid is different from assessmentUserId", async () => {
            jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
            jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
            jest.spyOn(authentication, "decodeToken").mockReturnValue({
                oid: "test",
            });
            jest.spyOn(persistence, "findInnovationComments").mockResolvedValue([
                { id: ":comment_id" } as any,
            ]);

            const { res } = await mockedRequestFactory({
                headers: { authorization: ":access_token" },
            });
            expect(res.status).toBe(403);
        });

        it("Should handle error persistence return error", async () => {
            jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
            jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
            jest.spyOn(authentication, "decodeToken").mockReturnValue({
                oid: ":assessment_user_id",
            });
            jest.spyOn(persistence, "findInnovationComments").mockRejectedValue(
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
        assessmentsGetInnovationComments,
        [
            {
                type: "httpTrigger",
                name: "req",
                direction: "in",
                data: createHttpTrigger(
                    "GET",
                    "http://nhse-i-aac/api/assessments/{userId}/innovations/{innovationId}/comments",
                    { ...data.headers }, // headers
                    {
                        userId: ":assessment_user_id",
                        innovationId: ":innovation_id",
                    }, // pathparams
                    {}, // payload/body
                    {
                        order: '{"createdAt": "asc"}'
                    } // querystring
                ),
            },
            { type: "http", name: "res", direction: "out" },
        ],
        new Date()
    );
}
