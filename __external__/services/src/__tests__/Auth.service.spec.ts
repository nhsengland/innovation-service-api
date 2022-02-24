import { AuthService } from "@services/services/Auth.service";
import * as dotenv from "dotenv";
import * as path from "path";
import { TTL2ls } from "../../../../schemas/TTL2ls";
import { closeTestsConnection, setupTestsConnection, UserType } from "..";
import * as helpers from "../helpers";
import * as fixtures from "../__fixtures__";
import { SLSEventType } from "@services/types";
import { UserEmailNotFound } from "@services/errors";

const dummy = {
  email: "email@email.com",
  requestUser: {
    id: ":userId",
    type: UserType.ADMIN,
  },
};

describe("Auth Service Suite", () => {
  let authService: AuthService;

  beforeAll(async () => {
    //await setupTestsConnection();
    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });
    authService = new AuthService(process.env.DB_TESTS_NAME);
  });

  afterAll(async () => {
    //await closeTestsConnection();
  });

  it("should instantiate the Auth service", () => {
    expect(authService).toBeDefined();
  });

  it("Should generate a TOTP for a given user", async () => {
    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([
      {
        id: ":admin_user_id",
        displayName: "Admin",
        identities: [
          {
            signInType: "emailAddress",
            issuerAssignedId: dummy.email,
          },
        ],
      },
    ]);
    jest.spyOn(TTL2ls, "findOneAndUpdate").mockImplementation();
    jest.spyOn(TTL2ls.prototype, "save").mockImplementation();
    jest.spyOn(authService, "sendTOTP").mockImplementation();

    const user = await fixtures.createAdminUser();

    let err;
    try {
      await authService.send2LS(user.id, SLSEventType.LOGIN);
    } catch (error) {
      err = error;
    }

    expect(err).toBeUndefined();
  });

  it("Should throw error when sending TOTP if user is not found", async () => {
    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([]);

    const user = await fixtures.createAdminUser();

    let err;
    try {
      await authService.send2LS(user.id, SLSEventType.LOGIN);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(UserEmailNotFound);
  });

  it.skip("Should generate a TOTP for a given user and return a 6-digit code", async () => {
    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([
      {
        id: ":admin_user_id",
        displayName: "Admin",
        identities: [
          {
            signInType: "emailAddress",
            issuerAssignedId: dummy.email,
          },
        ],
      },
    ]);
    jest.spyOn(TTL2ls, "findOneAndUpdate").mockResolvedValue("000000");
    jest.spyOn(TTL2ls.prototype, "save").mockImplementation();
    jest.spyOn(authService, "sendTOTP").mockImplementation();

    const user = await fixtures.createAdminUser();
    const code = await authService.send2LS(user.id, SLSEventType.LOGIN);

    expect(code).toBeDefined();
    expect(code.code.length).toBe(6);
  });

  it.skip("Should validate a TOTP for a given user", async () => {
    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([
      {
        id: ":admin_user_id",
        displayName: "Admin",
        identities: [
          {
            signInType: "emailAddress",
            issuerAssignedId: dummy.email,
          },
        ],
      },
    ]);
    jest.spyOn(TTL2ls, "findOneAndUpdate").mockResolvedValue("000000");
    jest.spyOn(TTL2ls.prototype, "save").mockImplementation();
    jest.spyOn(authService, "sendTOTP").mockImplementation();

    const user = await fixtures.createAdminUser();
    const code = await authService.send2LS(user.id, SLSEventType.LOGIN);

    jest
      .spyOn(TTL2ls, "findOne")
      .mockResolvedValue({ code: await authService.hash(code) });

    const actual = await authService.validate2LS(
      user.id,
      SLSEventType.LOGIN,
      code.code,
      ":id"
    );

    expect(actual).toBe(true);
  });

  it.skip("Should not validate a TOTP for a given user with mismatched codes", async () => {
    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([
      {
        id: ":admin_user_id",
        displayName: "Admin",
        identities: [
          {
            signInType: "emailAddress",
            issuerAssignedId: dummy.email,
          },
        ],
      },
    ]);

    const user = await fixtures.createAdminUser();

    jest.spyOn(TTL2ls, "findOneAndUpdate").mockResolvedValue("000000");
    jest.spyOn(TTL2ls.prototype, "save").mockImplementation();
    jest.spyOn(authService, "sendTOTP").mockImplementation();

    jest
      .spyOn(TTL2ls, "findOne")
      .mockResolvedValue({ code: await authService.hash("111111") });

    await authService.send2LS(user.id, SLSEventType.LOGIN);

    const actual = await authService.validate2LS(
      user.id,
      SLSEventType.LOGIN,
      "00000",
      ":id"
    );

    expect(actual).toBe(false);
  });

  it.skip("Should not validate a TOTP for a given user when code does not exist", async () => {
    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([
      {
        id: ":admin_user_id",
        displayName: "Admin",
        identities: [
          {
            signInType: "emailAddress",
            issuerAssignedId: dummy.email,
          },
        ],
      },
    ]);

    const user = await fixtures.createAdminUser();

    const actual = await authService.validate2LS(
      user.id,
      SLSEventType.LOGIN,
      "00000",
      ":id"
    );

    expect(actual).toBe(false);
  });

  it.skip("Should return true when a TOTP exists on the database for a given user", async () => {
    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([
      {
        id: ":admin_user_id",
        displayName: "Admin",
        identities: [
          {
            signInType: "emailAddress",
            issuerAssignedId: dummy.email,
          },
        ],
      },
    ]);

    const user = await fixtures.createAdminUser();
    jest.spyOn(TTL2ls, "findOneAndUpdate").mockResolvedValue("000000");
    jest.spyOn(TTL2ls.prototype, "save").mockImplementation();
    jest.spyOn(authService, "sendTOTP").mockImplementation();

    jest
      .spyOn(TTL2ls, "findOne")
      .mockResolvedValue({ id: ":id", code: await authService.hash("000000") });

    await authService.send2LS(user.id, SLSEventType.LOGIN);

    const actual = await authService.totpExists(user.id, "ACTION", ":id");

    expect(actual).toBe(true);
  });

  it("Should return false when a TOTP does not exist on the database for a given user", async () => {
    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([
      {
        id: ":admin_user_id",
        displayName: "Admin",
        identities: [
          {
            signInType: "emailAddress",
            issuerAssignedId: dummy.email,
          },
        ],
      },
    ]);

    const user = await fixtures.createAdminUser();
    jest.spyOn(TTL2ls, "findOneAndUpdate").mockResolvedValue("000000");
    jest.spyOn(TTL2ls.prototype, "save").mockImplementation();
    jest.spyOn(authService, "sendTOTP").mockImplementation();
    jest.spyOn(TTL2ls, "findOne").mockResolvedValue(false);

    const actual = await authService.totpExists(user.id, "ACTION", ":id");

    expect(actual).toBe(false);
  });
});
