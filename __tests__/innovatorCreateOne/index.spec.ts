import * as Validation from "../../innovatorsCreateOne/validation";
import * as persistence from "../../innovatorsCreateOne/persistence";

import innovatorsCreateOne from "../../innovatorsCreateOne";
import * as connection from "../../utils/connection";

import {
  runStubFunctionFromBindings,
  createHttpTrigger,
} from "stub-azure-function-context";

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
        payload: {
          actionType: "first_time_signin",
          innovator: { surveyId: "abc" },
          innovation: {
            name: "Innovation A",
            description: "description",
            countryName: "UK",
            postcode: "123",
          },
          organisation: { name: "Organization A", size: "huge" },
          user: { displayName: "User Test" },
        },
        headers: {
          authorization:
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlE3RjctWTB4WE9UVDFIdFFhVGt1VHBUUzBpRmtoaS1YcENxRnNKMTcxZGsifQ.eyJpc3MiOiJodHRwczovL25oc2FhY2RlYmIyYy5iMmNsb2dpbi5jb20vYmQ4OWQ4MWItNGZlMy00ZTZhLWFiZTItYmQ3YTNkM2MwMDBjL3YyLjAvIiwiZXhwIjoxNjE2NDM0OTQ2LCJuYmYiOjE2MTY0MzEzNDYsImF1ZCI6IjBkZTlmYTFhLTc0YmUtNDJlNy1hMWRmLWQzNzliMTU3OTA5NiIsInRlcm1zT2ZVc2VDb25zZW50UmVxdWlyZWQiOmZhbHNlLCJzdWIiOiI3ZTcwNGM4OC04NDkwLTRjMWUtOGZjNy1mNjQyYjIyZDdlM2UiLCJvaWQiOiI3ZTcwNGM4OC04NDkwLTRjMWUtOGZjNy1mNjQyYjIyZDdlM2UiLCJuYW1lIjoiRGlvZ28gdGVpeGVpcmEiLCJnaXZlbl9uYW1lIjoiRGlvZ28iLCJmYW1pbHlfbmFtZSI6IlRlaXhlaXJhIiwibm9uY2UiOiJFdGY5WlNGdGxqLUJTbzFkc2F4MnNpVVZGN21hWnhsYyIsInNjcCI6InRlc3Qud3JpdGUgdGVzdC5yZWFkIiwiYXpwIjoiMGRlOWZhMWEtNzRiZS00MmU3LWExZGYtZDM3OWIxNTc5MDk2IiwidmVyIjoiMS4wIiwiaWF0IjoxNjE2NDMxMzQ2fQ.jvU_xK9e_YkxMW_P9TVkGKmPJV06j6V9QNAMgExCDihYe9vJaP3H38m0TB_EI6ulr58Tj0WuKPK1GREwD7PEReFPVXJZ6JedgA5xlBniX-CyLXd-l8k1wGtGfJA3p3t8EFDO3VsVPQ1iwjDqNpoDZu_Z-8MX2Er49GqKAvfC7Aq8JrtuyByX4MN1-70R7iHWA9q9l_qDoacP2WEAVzbzGjznW1tFJhgOgjMzHfRBnra45UTESRBfaUdksf3Ma8Ji4thsvuRvQhKwuHUPFMgpJ_ZWT39ELL_aNZdUNf-JGlKQ6s763AfnkDzjY62AkZakSWnBySEAoNTLWkWu9FL5AA",
        },
      };

      const { res } = await mockedRequestFactory(data);
      expect(res.status).toBe(201);
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
