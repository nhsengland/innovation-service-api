import { Innovation, User } from "@domain/index";
import { getConnection } from "typeorm";
import { UserService } from "@services/services/User.service";
import { EmailService } from "@services/services/Email.service";
import * as helpers from "../helpers";
import { closeTestsConnection, setupTestsConnection } from "..";

describe("Email Service Suite", () => {
  let userService: UserService;
  let emailService: EmailService;

  beforeAll(async () => {
    //await setupTestsConnection();
    emailService = new EmailService(process.env.DB_TESTS_NAME);
    userService = new UserService(process.env.DB_TESTS_NAME);
  });

  afterAll(async () => {
    // const query = getConnection(process.env.DB_TESTS_NAME)
    //   .createQueryBuilder()
    //   .delete();
    // await query.from(Innovation).execute();
    // await query.from(User).execute();
    // await closeTestsConnection();
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
      "first name": "Accessor 1",
      "innovator name": "Innovator Name 1",
      "innovation name": "The Innovation",
      "action name with URL": "https://example.com/action_1",
    };

    const actual = await emailService.send(
      ":accessor_user_id_1",
      "ACCESSORS_ACTION_TO_REVIEW",
      props
    );

    expect(actual.id).toBeDefined();
  });
});
