import * as Responsify from "../../utils/responsify";

describe("[Utils] Responsify suite", () => {
  describe("Ok", () => {
    it("should return 200 OK with no body", () => {
      const result = Responsify.Ok(null);
      expect(result.body).toBeNull();
      expect(result.status).toBe(200);
    });

    it("should return 200 OK with body", () => {
      const body = {
        prop: 1,
      };
      const result = Responsify.Ok(body);
      expect(result.body).toEqual(body);
      expect(result.status).toBe(200);
    });

    it("should return 200 OK with headers", () => {
      const headers = {
        Authorization: "Bearer test",
      };

      const expected = {
        "Content-Type": "application/json",
        ...headers,
      };
      const result = Responsify.Ok(null, headers);
      expect(result.headers).toEqual(expected);
      expect(result.status).toBe(200);
    });
  });
  describe("Created", () => {
    it("should return 201 Created with no body", () => {
      const result = Responsify.Created(null);
      expect(result.body).toBeNull();
      expect(result.status).toBe(201);
    });

    it("should return 201 Created with body", () => {
      const body = {
        prop: 1,
      };
      const result = Responsify.Created(body);
      expect(result.body).toEqual(body);
      expect(result.status).toBe(201);
    });

    it("should return 201 Created with headers", () => {
      const headers = {
        Authorization: "Bearer test",
      };

      const expected = {
        "Content-Type": "application/json",
        ...headers,
      };
      const result = Responsify.Created(null, headers);
      expect(result.headers).toEqual(expected);
      expect(result.status).toBe(201);
    });

    it("should return 204 NoContent with headers", () => {
      const headers = {
        Authorization: "Bearer test",
      };

      const expected = {
        "Content-Type": "application/json",
        ...headers,
      };
      const result = Responsify.NoContent(null, headers);
      expect(result.headers).toEqual(expected);
      expect(result.status).toBe(204);
    });
  });

  describe("BadRequest", () => {
    it("should return 400 with no body", () => {
      const result = Responsify.BadRequest(null);
      expect(result.body).toBeNull();
      expect(result.status).toBe(400);
    });

    it("should return 400 with body", () => {
      const body = {
        prop: 1,
      };
      const result = Responsify.BadRequest(body);
      expect(result.body).toEqual(body);
      expect(result.status).toBe(400);
    });

    it("should return 400 with headers", () => {
      const headers = {
        Authorization: "Bearer test",
      };

      const expected = {
        "Content-Type": "application/json",
        ...headers,
      };
      const result = Responsify.BadRequest(null, headers);
      expect(result.headers).toEqual(expected);
      expect(result.status).toBe(400);
    });
  });

  describe("Unauthorized", () => {
    it("should return 401 with no body", () => {
      const result = Responsify.Unauthorized(null);
      expect(result.body).toBeNull();
      expect(result.status).toBe(401);
    });

    it("should return 401 with body", () => {
      const body = {
        prop: 1,
      };
      const result = Responsify.Unauthorized(body);
      expect(result.body).toEqual(body);
      expect(result.status).toBe(401);
    });

    it("should return 401 with headers", () => {
      const headers = {
        Authorization: "Bearer test",
      };

      const expected = {
        "Content-Type": "application/json",
        ...headers,
      };
      const result = Responsify.Unauthorized(null, headers);
      expect(result.headers).toEqual(expected);
      expect(result.status).toBe(401);
    });
  });

  describe("Forbidden", () => {
    it("should return 403 with no body", () => {
      const result = Responsify.Forbidden(null);
      expect(result.body).toBeNull();
      expect(result.status).toBe(403);
    });

    it("should return 403 with body", () => {
      const body = {
        prop: 1,
      };
      const result = Responsify.Forbidden(body);
      expect(result.body).toEqual(body);
      expect(result.status).toBe(403);
    });

    it("should return 403 with headers", () => {
      const headers = {
        Authorization: "Bearer test",
      };

      const expected = {
        "Content-Type": "application/json",
        ...headers,
      };
      const result = Responsify.Forbidden(null, headers);
      expect(result.headers).toEqual(expected);
      expect(result.status).toBe(403);
    });
  });

  describe("NotFound", () => {
    it("should return 404 with no body", () => {
      const result = Responsify.NotFound(null);
      expect(result.body).toBeNull();
      expect(result.status).toBe(404);
    });

    it("should return 404 with body", () => {
      const body = {
        prop: 1,
      };
      const result = Responsify.NotFound(body);
      expect(result.body).toEqual(body);
      expect(result.status).toBe(404);
    });

    it("should return 404 with headers", () => {
      const headers = {
        Authorization: "Bearer test",
      };

      const expected = {
        "Content-Type": "application/json",
        ...headers,
      };
      const result = Responsify.NotFound(null, headers);
      expect(result.headers).toEqual(expected);
      expect(result.status).toBe(404);
    });
  });

  describe("BadData", () => {
    it("should return 422 with no body", () => {
      const result = Responsify.BadData(null);
      expect(result.body).toBeNull();
      expect(result.status).toBe(422);
    });

    it("should return 422 with body", () => {
      const body = {
        prop: 1,
      };
      const result = Responsify.BadData(body);
      expect(result.body).toEqual(body);
      expect(result.status).toBe(422);
    });

    it("should return 422 with headers", () => {
      const headers = {
        Authorization: "Bearer test",
      };

      const expected = {
        "Content-Type": "application/json",
        ...headers,
      };
      const result = Responsify.BadData(null, headers);
      expect(result.headers).toEqual(expected);
      expect(result.status).toBe(422);
    });
  });

  describe("Internal", () => {
    it("should return 500 with no body", () => {
      const result = Responsify.Internal(null);
      expect(result.body).toBeNull();
      expect(result.status).toBe(500);
    });

    it("should return 500 with body", () => {
      const body = {
        prop: 1,
      };
      const result = Responsify.Internal(body);
      expect(result.body).toEqual(body);
      expect(result.status).toBe(500);
    });

    it("should return 500 with headers", () => {
      const headers = {
        Authorization: "Bearer test",
      };

      const expected = {
        "Content-Type": "application/json",
        ...headers,
      };
      const result = Responsify.Internal(null, headers);
      expect(result.headers).toEqual(expected);
      expect(result.status).toBe(500);
    });
  });
});
