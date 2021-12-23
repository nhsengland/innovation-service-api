import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import { EmailService } from "@services/services/Email.service";
import { UserService } from "@services/services/User.service";
import * as dotenv from "dotenv";
import * as path from "path";
import {
  closeTestsCosmosDb,
  setupTestsCosmosDb,
} from "../../../../utils/connection";
import { closeTestsConnection, setupTestsConnection, UserType } from "..";
import * as helpers from "../helpers";
import * as fixtures from "../__fixtures__";
import { TTL2ls } from "../../../../schemas/TTL2ls";

const dummy = {
  email: "email@email.com",
  requestUser: {
    id: ":userId",
    type: UserType.ADMIN,
  },
};

describe("Email Service Suite", () => {
  let userService: UserService;
  let emailService: EmailService;

  beforeAll(async () => {
    //await setupTestsConnection();
    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });
    emailService = new EmailService(process.env.DB_TESTS_NAME);
    userService = new UserService(process.env.DB_TESTS_NAME);
  });

  afterAll(async () => {
    //await closeTestsConnection();
  });

  it("should instantiate the Email service", () => {
    expect(emailService).toBeDefined();
  });

  it("should send a test email", async () => {
    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([
      {
        id: ":accessor_user_id_1",
        displayName: "Accessor 1",
        identities: [
          {
            signInType: "emailAddress",
            issuerAssignedId: dummy.email,
          },
        ],
      },
    ]);

    const props = {
      display_name: "Accessor 1",
      innovator_name: "Innovator Name 1",
      innovation_name: "The Innovation",
      action_url: "https://example.com/action_1",
      test: "gdgjkfd",
    };

    const actual = await emailService.sendMany(
      [":accessor_user_id_1"],
      EmailNotificationTemplate.ACCESSORS_ACTION_TO_REVIEW,
      props
    );

    expect(actual.length).toBeGreaterThan(0);
  });

  it("should fail sending email when personalisation has incorrect properties", async () => {
    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([
      {
        id: ":accessor_user_id_1",
        displayName: "Accessor 1",
        identities: [
          {
            signInType: "emailAddress",
            issuerAssignedId: dummy.email,
          },
        ],
      },
    ]);

    const props = {
      display_name: "Accessor 1",
      innovator_name: "Innovator Name 1",
      innovation_name: "The Innovation",
      incorrect_property: "https://example.com/action_1",
    };

    let err;
    try {
      await emailService.sendMany(
        [":accessor_user_id_1"],
        EmailNotificationTemplate.ACCESSORS_ACTION_TO_REVIEW,
        props
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.name).toBe("InvalidEmailTemplateProps");
  });

  it("should fail sending email when personalisation has missing properties", async () => {
    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([
      {
        id: ":accessor_user_id_1",
        displayName: "Accessor 1",
        identities: [
          {
            signInType: "emailAddress",
            issuerAssignedId: dummy.email,
          },
        ],
      },
    ]);

    const props = {
      display_name: "Accessor 1",
    };

    let err;
    try {
      await emailService.sendMany(
        [":accessor_user_id_1"],
        EmailNotificationTemplate.ACCESSORS_ACTION_TO_REVIEW,
        props
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.name).toBe("InvalidEmailTemplateProps");
  });

  it.skip("Should generate a TOTP for a given user", async () => {
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
    jest.spyOn(emailService, "sendTOTP").mockImplementation();

    const user = await fixtures.createAdminUser();

    let err;
    try {
      await emailService.send2LS(user.id);
    } catch (error) {
      err = error;
    }

    expect(err).toBeUndefined();
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
    jest.spyOn(emailService, "sendTOTP").mockImplementation();

    const user = await fixtures.createAdminUser();
    const code = await emailService.send2LS(user.id);

    expect(code).toBeDefined();
    expect(code.length).toBe(6);
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
    jest.spyOn(emailService, "sendTOTP").mockImplementation();

    const user = await fixtures.createAdminUser();
    const code = await emailService.send2LS(user.id);

    jest
      .spyOn(TTL2ls, "findOne")
      .mockResolvedValue({ code: await emailService.hash(code) });

    const actual = await emailService.validate2LS(user.id, code);

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
    jest.spyOn(emailService, "sendTOTP").mockImplementation();

    jest
      .spyOn(TTL2ls, "findOne")
      .mockResolvedValue({ code: await emailService.hash("111111") });

    await emailService.send2LS(user.id);

    const actual = await emailService.validate2LS(user.id, "00000");

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

    const actual = await emailService.validate2LS(user.id, "00000");

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
    jest.spyOn(emailService, "sendTOTP").mockImplementation();

    jest
      .spyOn(TTL2ls, "findOne")
      .mockResolvedValue({ code: await emailService.hash("000000") });

    await emailService.send2LS(user.id);

    const actual = await emailService.totpExists(user.id);

    expect(actual).toBe(true);
  });

  it.skip("Should return false when a TOTP does not exist on the database for a given user", async () => {
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
    jest.spyOn(emailService, "sendTOTP").mockImplementation();
    jest.spyOn(TTL2ls, "findOne").mockImplementation();

    const actual = await emailService.totpExists(user.id);

    expect(actual).toBe(false);
  });
});
