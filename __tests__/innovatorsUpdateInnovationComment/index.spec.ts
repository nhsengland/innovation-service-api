/* eslint-disable */
import { UserType } from "@services/index";
import {
  createHttpTrigger,
  runStubFunctionFromBindings,
} from "stub-azure-function-context";
import innovatorsUpdateInnovationComment from "../../innovatorsUpdateInnovationComment";
import * as persistence from "../../innovatorsUpdateInnovationComment/persistence";
import * as validation from "../../innovatorsUpdateInnovationComment/validation";
import * as authentication from "../../utils/authentication";
import * as connection from "../../utils/connection";
import * as service_loader from "../../utils/serviceLoader";

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
        type: UserType.INNOVATOR,
      }),
      getUserByOptions: () => ({
        type: UserType.INNOVATOR,
      }),
    },
  },
  innovationId: "test_innovation_id",
  innovatorId: "test_innovator_id",
  commentId:"test_comment_id",
};

describe("[HttpTrigger] innovatorsUpdateInnovationComment Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("fails when connection is not established", async () => {
      jest
        .spyOn(authentication, "decodeToken")
        .mockReturnValue({ oid: ":oid" });
      jest
        .spyOn(connection, "setupSQLConnection")
        .mockRejectedValue(
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
      jest
        .spyOn(service_loader, "loadAllServices")
        .mockResolvedValue(dummy.services as any);
      jest.spyOn(validation, "ValidatePayload").mockReturnValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: dummy.innovatorId,
      });
      jest
        .spyOn(persistence, "updateInnovationComment")
        .mockResolvedValue([{ id: "comment_id" }] as any);

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(200);
    });

    it("Should return 403 when innovator has an invalid user type", async () => {
      const services = {
        UserService: {
          getUser: () => ({
            type: UserType.ACCESSOR,
          }),
          getUserByOptions: () => ({
            type: UserType.ACCESSOR,
          }),
        },
      };

      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest
        .spyOn(service_loader, "loadAllServices")
        .mockResolvedValue(services as any);
      jest.spyOn(validation, "ValidatePayload").mockReturnValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: dummy.innovatorId,
      });
      jest
        .spyOn(persistence, "updateInnovationComment")
        .mockResolvedValue([{ id: "comment_id" }] as any);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(403);
    });

    it("Should throw error when oid is different from innovatorId", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest
        .spyOn(service_loader, "loadAllServices")
        .mockResolvedValue(dummy.services as any);
      jest.spyOn(validation, "ValidatePayload").mockReturnValue({} as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: "other",
      });
      jest
        .spyOn(persistence, "updateInnovationComment")
        .mockResolvedValue([{ id: "comment_id" }] as any);

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(403);
    });

    it("Should handle error persistence return error", async () => {
      jest.spyOn(connection, "setupSQLConnection").mockResolvedValue(null);
      jest
        .spyOn(service_loader, "loadAllServices")
        .mockResolvedValue(dummy.services as any);
      jest.spyOn(authentication, "decodeToken").mockReturnValue({
        oid: dummy.innovatorId,
      });
      jest
        .spyOn(persistence, "updateInnovationComment")
        .mockRejectedValue("Error.");

      const { res } = await mockedRequestFactory({
        headers: { authorization: ":access_token" },
      });
      expect(res.status).toBe(500);
    });
  });
});

async function mockedRequestFactory(data?: any) {
  return runStubFunctionFromBindings(
    innovatorsUpdateInnovationComment,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "PUT",
          "http://nhse-i-aac/api/innovators/{userId}/innovations/{innovationId}/comments/{commentId}",
          { ...data.headers }, // headers
          {
            commentId: dummy.commentId,
            userId: dummy.innovatorId,
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
