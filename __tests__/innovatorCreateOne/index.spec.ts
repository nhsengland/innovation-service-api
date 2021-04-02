import * as Validation from "../../innovatorsCreateOne/validation";
import * as persistence from "../../innovatorsCreateOne/persistence";

import innovatorsCreateOne from "../../innovatorsCreateOne";
import * as connection from "../../utils/connection";

import {
  runStubFunctionFromBindings,
  createHttpTrigger,
} from "stub-azure-function-context";

const dummy = {
  validPayload: {
    actionType: "first_time_signin",
    innovation: {
      name: "Innovation A",
      description: "description",
      countryName: "UK",
      postcode: "123",
    },
    organisation: { name: "Organization A", size: "huge" },
    user: { displayName: "User Test" },
  },
  validJwtToken:
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlE3RjctWTB4WE9UVDFIdFFhVGt1VHBUUzBpRmtoaS1YcENxRnNKMTcxZGsifQ.eyJpc3MiOiJodHRwczovL25oc2FhY2RlYmIyYy5iMmNsb2dpbi5jb20vYmQ4OWQ4MWItNGZlMy00ZTZhLWFiZTItYmQ3YTNkM2MwMDBjL3YyLjAvIiwiZXhwIjoxNjE3MjA0MDg5LCJuYmYiOjE2MTcyMDA0ODksImF1ZCI6IjBkZTlmYTFhLTc0YmUtNDJlNy1hMWRmLWQzNzliMTU3OTA5NiIsInRlcm1zT2ZVc2VDb25zZW50UmVxdWlyZWQiOmZhbHNlLCJzdWIiOiJhNmExNzJmMy1jYzlhLTRjMjAtOTc2MC1kYjMzNjRkNTFiYjUiLCJvaWQiOiJhNmExNzJmMy1jYzlhLTRjMjAtOTc2MC1kYjMzNjRkNTFiYjUiLCJuYW1lIjoidW5rbm93biIsImV4dGVuc2lvbl9zdXJ2ZXlJZCI6ImJhdGF0YXMiLCJub25jZSI6IldLbUV1dzEwYkRZZG5RemtpQjhnYUJuaFJWQjFkVmwxIiwic2NwIjoidGVzdC53cml0ZSB0ZXN0LnJlYWQiLCJhenAiOiIwZGU5ZmExYS03NGJlLTQyZTctYTFkZi1kMzc5YjE1NzkwOTYiLCJ2ZXIiOiIxLjAiLCJpYXQiOjE2MTcyMDA0ODl9.RrtRZqLg48rwjwKZh8R60SF03caKR2bTk28sBzwBeH6nxYg3W--mbGWtkCFHXqf-mUQZkftH1jtomFJHxF0757THcZkP4eJb8_CJo8Lhnnd0lkuPfbRRcxcl_c7p2JKe8fgZHVhuO0hLgGiRkchT-hR_4VeLzEiN2fEBWzwc891V4si9HsZjUMQc8CHcdMg1CfbXjInZuxaWBdGQC7ZVKjDtXEXc2czkyuvvDKdQAPxpw3rAmGieLkJtTrFn9xNqOd4mtWg-DNa6xAWIpah31ur-7mxnRrkGz9d727CNL2VfT9BjxENAcqMitZryQAMx4Of_EeIU6hbcp04xVM0pgg",
  invalidJwtMissingSurveyId:
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlE3RjctWTB4WE9UVDFIdFFhVGt1VHBUUzBpRmtoaS1YcENxRnNKMTcxZGsifQ.eyJpc3MiOiJodHRwczovL25oc2FhY2RlYmIyYy5iMmNsb2dpbi5jb20vYmQ4OWQ4MWItNGZlMy00ZTZhLWFiZTItYmQ3YTNkM2MwMDBjL3YyLjAvIiwiZXhwIjoxNjE2NDM0OTQ2LCJuYmYiOjE2MTY0MzEzNDYsImF1ZCI6IjBkZTlmYTFhLTc0YmUtNDJlNy1hMWRmLWQzNzliMTU3OTA5NiIsInRlcm1zT2ZVc2VDb25zZW50UmVxdWlyZWQiOmZhbHNlLCJzdWIiOiI3ZTcwNGM4OC04NDkwLTRjMWUtOGZjNy1mNjQyYjIyZDdlM2UiLCJvaWQiOiI3ZTcwNGM4OC04NDkwLTRjMWUtOGZjNy1mNjQyYjIyZDdlM2UiLCJuYW1lIjoiRGlvZ28gdGVpeGVpcmEiLCJnaXZlbl9uYW1lIjoiRGlvZ28iLCJmYW1pbHlfbmFtZSI6IlRlaXhlaXJhIiwibm9uY2UiOiJFdGY5WlNGdGxqLUJTbzFkc2F4MnNpVVZGN21hWnhsYyIsInNjcCI6InRlc3Qud3JpdGUgdGVzdC5yZWFkIiwiYXpwIjoiMGRlOWZhMWEtNzRiZS00MmU3LWExZGYtZDM3OWIxNTc5MDk2IiwidmVyIjoiMS4wIiwiaWF0IjoxNjE2NDMxMzQ2fQ.jvU_xK9e_YkxMW_P9TVkGKmPJV06j6V9QNAMgExCDihYe9vJaP3H38m0TB_EI6ulr58Tj0WuKPK1GREwD7PEReFPVXJZ6JedgA5xlBniX-CyLXd-l8k1wGtGfJA3p3t8EFDO3VsVPQ1iwjDqNpoDZu_Z-8MX2Er49GqKAvfC7Aq8JrtuyByX4MN1-70R7iHWA9q9l_qDoacP2WEAVzbzGjznW1tFJhgOgjMzHfRBnra45UTESRBfaUdksf3Ma8Ji4thsvuRvQhKwuHUPFMgpJ_ZWT39ELL_aNZdUNf-JGlKQ6s763AfnkDzjY62AkZakSWnBySEAoNTLWkWu9FL5AA",
};

describe("[HttpTrigger] innovatorCreateOne Suite", () => {
  describe("Function Handler", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("fails when connection is not established", async () => {
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

    it("fails on missing payload", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(422);
    });

    it("fails on missing authorization header", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(Validation, "ValidatePayload").and.returnValue({});

      const { res } = await mockedRequestFactory({});
      expect(res.status).toBe(400);
    });

    it("Successfuly validates payload and headers", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(persistence, "createInnovator").and.returnValue({});
      spyOn(persistence, "updateUserDisplayName").and.returnValue({});

      const data = {
        payload: dummy.validPayload,
        headers: {
          authorization: dummy.validJwtToken,
        },
      };

      const { res } = await mockedRequestFactory(data);
      expect(res.status).toBe(201);
    });

    it("Should return status 400 when surveyId is not present in the JWT", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(persistence, "createInnovator").and.returnValue({});
      spyOn(persistence, "updateUserDisplayName").and.throwError(null);

      const data = {
        payload: dummy.validPayload,
        headers: {
          authorization: dummy.invalidJwtMissingSurveyId,
        },
      };

      const { res } = await mockedRequestFactory(data);
      expect(res.status).toBe(400);
    });

    it("Should return status 500 when updateDisplayName fails", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(persistence, "createInnovator").and.returnValue({});
      spyOn(persistence, "updateUserDisplayName").and.throwError(null);

      const data = {
        payload: dummy.validPayload,
        headers: {
          authorization: dummy.validJwtToken,
        },
      };

      const { res } = await mockedRequestFactory(data);
      expect(res.status).toBe(500);
    });

    it("Should return status 500 when createInnovator fails", async () => {
      spyOn(connection, "setupSQLConnection").and.returnValue(null);
      spyOn(persistence, "createInnovator").and.throwError(null);
      spyOn(persistence, "updateUserDisplayName").and.returnValue(null);

      const data = {
        payload: dummy.validPayload,
        headers: {
          authorization: dummy.validJwtToken,
        },
      };

      const { res } = await mockedRequestFactory(data);
      expect(res.status).toBe(500);
    });
  });
});

async function mockedRequestFactory(data?: any) {
  return runStubFunctionFromBindings(
    innovatorsCreateOne,
    [
      {
        type: "httpTrigger",
        name: "req",
        direction: "in",
        data: createHttpTrigger(
          "POST",
          "http://nhse-i-aac/api/surveys",
          { ...data.headers }, // headers
          {}, // ?
          { ...data.payload }, // payload/body
          undefined // querystring
        ),
      },
      { type: "http", name: "res", direction: "out" },
    ],
    new Date()
  );
}
