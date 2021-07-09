/* eslint-disable */
import * as mongoose from "mongoose";
import {
  createHttpTrigger, runStubFunctionFromBindings
} from "stub-azure-function-context";
import surveyCreateOne from "../../surveyCreateOne/index";
import * as persistence from "../../surveyCreateOne/persistence";
import * as Validation from "../../surveyCreateOne/validation";

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


describe("[HttpTrigger] SurveyCreateOne Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("fails when connection is not established", async () => {
      spyOn(mongoose, "connect").and.throwError(
        "Error establishing connection with the datasource."
      );

      const { res } = await mockedRequestFactory();
      expect(res.status).toBe(500);
      expect(res.body.error).toBeDefined();
      expect(res.body.error).toBe(
        "Error establishing connection with the datasource."
      );
    });

    it("fails on missing payload", async () => {
      spyOn(mongoose, "connect").and.returnValue(null);

      const { res } = await mockedRequestFactory();
      expect(res.status).toBe(422);
    });

    it("succeeds on persisting document", async () => {
      spyOn(mongoose, "connect").and.returnValue(null);
      spyOn(Validation, "ValidatePayload").and.returnValue({ error: null });
      spyOn(persistence, "GetId").and.returnValue("aaaa-bbb-ccc");
      const spy = spyOn(persistence, "Save");

      await mockedRequestFactory();
      expect(spy).toHaveBeenCalled();
    });

    it("fails on persisting document", async () => {
      spyOn(mongoose, "connect").and.returnValue(null);
      spyOn(Validation, "ValidatePayload").and.returnValue({ error: null });
      spyOn(persistence, "Save").and.throwError(null);

      const { res } = await mockedRequestFactory();
      expect(res.status).toBe(500);
    });
  });
});

async function mockedRequestFactory(data?: any) {
  return runStubFunctionFromBindings(
    surveyCreateOne,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger("POST", "http://nhse-i-aac/api/surveys"),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
