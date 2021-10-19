import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import { EmailService } from "@services/services/Email.service";
import { UserService } from "@services/services/User.service";
import * as dotenv from "dotenv";
import * as path from "path";
import { closeTestsConnection, setupTestsConnection } from "..";
import * as helpers from "../helpers";

const dummy = {
  email: "email@email.com",
};
describe("Email Service Suite", () => {
  let userService: UserService;
  let emailService: EmailService;

  beforeAll(async () => {
    // await setupTestsConnection();

    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });
    emailService = new EmailService(process.env.DB_TESTS_NAME);
    userService = new UserService(process.env.DB_TESTS_NAME);
  });

  afterAll(async () => {
    // await closeTestsConnection();
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
});
