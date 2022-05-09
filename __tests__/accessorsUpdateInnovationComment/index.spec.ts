/* eslint-disable */
import { AccessorOrganisationRole, UserType } from "@services/index";
import {
  createHttpTrigger,
  runStubFunctionFromBindings
} from "stub-azure-function-context";
import accessorsUpdateInnovationComment from "../../accessorsUpdateInnovationComment";
import * as persistence from "../../accessorsUpdateInnovationComment/persistence";
import * as validation from "../../accessorsUpdateInnovationComment/validation";
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
  innovationId: "test_innovation_id",
  accessorId: "test_accessor_id",
  commentId:"test_comment_id"
};

describe("[HttpTrigger] accessorsUpdateInnovationComment Suite", () => {
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

    it("Should return 200 when Innovation Comment is updated", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(validation, "ValidatePayload").mockReturnValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: dummy.accessorId,
      });
      jest.spyOn(persistence, "updateInnovationComment").mockResolvedValue([
        { id: "comment_id" },
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
      jest.spyOn(validation, "ValidatePayload").mockReturnValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: dummy.accessorId,
      });
      jest.spyOn(persistence, "updateInnovationComment").mockResolvedValue([
        { id: "comment_id" },
      ] as any);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(403);
    });

    it.skip("Should throw error when oid is different from accessorId", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest.spyOn(service_loader, "loadAllServices").mockResolvedValue(dummy.services as any);
      jest.spyOn(validation, "ValidatePayload").mockReturnValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: "other",
      });
      jest.spyOn(persistence, "updateInnovationComment").mockResolvedValue([
        { id: "comment_id" },
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
        oid: dummy.accessorId,
      });
      jest.spyOn(persistence, "updateInnovationComment").mockRejectedValue(
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
    accessorsUpdateInnovationComment,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "PUT",
          "http://nhse-i-aac/api/accessors/{userId}/innovations/{innovationId}/comments/{commentId}",
          { ...data.headers }, // headers
          {
            commentId: dummy.commentId,
            userId: dummy.accessorId,
            innovationId: dummy.innovationId,
          },
          {
            comment: ":comment",
          }, // payload/body
          null // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
