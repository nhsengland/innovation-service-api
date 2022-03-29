import * as handlers from "../handlers/index";
import { RequestUser } from "@services/models/RequestUser";
import { UserType } from "@domain/index";
import { UserService } from "@services/index";
import axios from "axios";
import * as dotenv from "dotenv";
import * as path from "path";

import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import { InvalidEmailTemplateProps } from "@services/errors";
describe("innovatorsCommentReceivedHandler suite", () => {
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });
  });
  it("should throw InvalidEmailTemplateProps", async () => {
    const reqUser: RequestUser = {
      id: ":id",
      type: UserType.INNOVATOR,
    };

    jest.spyOn(UserService.prototype, "getUsersEmail").mockResolvedValue([
      {
        email: "email_address@example.com",
        displayName: "display_name",
      },
    ]);

    jest.spyOn(axios, "post").mockResolvedValue({
      data: {},
    });

    const params = {
      innovationId: "_innovation_id",
      contextId: "_context_id",
      emailProps: {},
    };

    const template = EmailNotificationTemplate.INNOVATORS_COMMENT_RECEIVED;

    let err: InvalidEmailTemplateProps;
    try {
      await handlers.innovatorsCommentReceivedHandler(
        reqUser,
        params,
        template,
        ["user_id"],
        process.env.DB_TESTS_NAME
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidEmailTemplateProps);
  });

  it("should Send email with the correct handler", async () => {
    const reqUser: RequestUser = {
      id: ":id",
      type: UserType.INNOVATOR,
    };

    jest.spyOn(UserService.prototype, "getUsersEmail").mockResolvedValue([
      {
        email: "email_address@example.com",
        displayName: "display_name",
      },
    ]);

    jest.spyOn(axios, "post").mockResolvedValue({
      data: {},
    });

    jest.spyOn(UserService.prototype, "getListOfUsers").mockResolvedValue([
      {
        displayName: "test_user",
        id: "_id",
        email: "email_address@example.com",
      },
    ]);

    const params = {
      innovationId: "_innovation_id",
      contextId: "_context_id",
      emailProps: {
        accessor_name: "accessor name",
        unit_name: "unit name",
      },
    };

    const template = EmailNotificationTemplate.INNOVATORS_COMMENT_RECEIVED;

    let err: InvalidEmailTemplateProps;
    let result;
    try {
      result = await handlers.innovatorsCommentReceivedHandler(
        reqUser,
        params,
        template,
        ["user_id"],
        process.env.DB_TESTS_NAME
      );
    } catch (error) {
      err = error;
    }

    expect(err).not.toBeDefined();
    expect(result).toBeDefined();
  });
});
