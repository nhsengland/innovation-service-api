import { Innovation, User } from "@domain/index";
import { getConnection } from "typeorm";
import { UserService } from "@services/services/User.service";
import { EmailService } from "@services/services/Email.service";
import * as helpers from "../helpers";
import { closeTestsConnection, setupTestsConnection } from "..";
import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import { InvalidEmailTemplateProps } from "@services/errors";
import * as dotenv from "dotenv";
import * as path from "path";

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
    spyOn(helpers, "authenticateWitGraphAPI");
    spyOn(helpers, "getUsersFromB2C").and.returnValue([
      {
        id: ":accessor_user_id_1",
        displayName: "Accessor 1",
        identities: [
          {
            signInType: "emailAddress",
            issuerAssignedId: "antonio.simoes@bjss.com",
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

    const actual = await emailService.send(
      [":accessor_user_id_1"],
      EmailNotificationTemplate.ACCESSORS_ACTION_TO_REVIEW,
      props
    );

    expect(actual.length).toBeGreaterThan(0);
  });

  it("should fail sending email when personalisation has incorrect properties", async () => {
    spyOn(helpers, "authenticateWitGraphAPI");
    spyOn(helpers, "getUsersFromB2C").and.returnValue([
      {
        id: ":accessor_user_id_1",
        displayName: "Accessor 1",
        identities: [
          {
            signInType: "emailAddress",
            issuerAssignedId: "antonio.simoes@bjss.com",
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
      await emailService.send(
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
    spyOn(helpers, "authenticateWitGraphAPI");
    spyOn(helpers, "getUsersFromB2C").and.returnValue([
      {
        id: ":accessor_user_id_1",
        displayName: "Accessor 1",
        identities: [
          {
            signInType: "emailAddress",
            issuerAssignedId: "antonio.simoes@bjss.com",
          },
        ],
      },
    ]);

    const props = {
      display_name: "Accessor 1",
    };

    let err;
    try {
      await emailService.send(
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
