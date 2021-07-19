import * as config from "@config/index";
import { UserService } from "./User.service";
import { UserEmailModel } from "@services/models/ProfileSlimModel";
import {
  EmailTemplateNotFound,
  InvalidAPIKey,
  InvalidEmailTemplateProps,
} from "@services/errors";
import * as uuid from "uuid";
import axios from "axios";
import * as jwt from "jsonwebtoken";

export type EmailResponse = {
  id: string;
  reference: string | null | undefined;
  content: {
    subject: string;
    body: string;
    from_email: string;
  };
  uri: string;
  template: {
    id: string;
    version: number;
    uri: string;
  };
};

export type EmailProps = {
  [key: string]: string;
};

export type EmailTemplate = {
  id: string;
  code: string;
  props: EmailProps;
};

export type NotifyClientParams = {
  personalisation?: EmailProps;
  reference?: string;
  emailReplyToId?: string;
};

export type NotifyClient = {
  sendEmail(
    templateId: string,
    emailAddress: string,
    params?: NotifyClientParams
  );
};

export class EmailService {
  private readonly userService: UserService;

  constructor(connectionName?: string) {
    const key = config.default.get("email.credentials");
    this.userService = new UserService(connectionName);
  }

  async send(
    recipientId: string,
    templateCode: string,
    props?: EmailProps
  ): Promise<EmailResponse> {
    const template = config.default
      .get("email.templates")
      .find((t) => t.code === templateCode);
    if (!template)
      throw new EmailTemplateNotFound(
        `Could not find a template with the code ${templateCode}`
      );

    const validProps = this.validateAndParseProps(template, props);
    if (!validProps)
      throw new InvalidEmailTemplateProps("Invalid email template properties.");

    const emails: UserEmailModel[] = await this.userService.getUserEmail(
      recipientId
    );

    if (emails.length === 0) return;

    const email = emails[0];

    const reference = uuid.v4();

    const properties: NotifyClientParams = {
      personalisation: { ...(validProps as EmailProps) },
      reference,
    };

    const token = config.default.get("email.credentials");

    const jwtToken = this.generateBearerToken(token);

    const postConfig = {
      headers: { Authorization: `Bearer ${jwtToken}` },
    };

    const baseUrl = config.default.get("email.api_base_url");
    const emailPath = config.default.get("email.api_email_path");
    const url = `${baseUrl}${emailPath}`;

    const response = await axios.post(
      url,
      {
        template_id: template.id,
        email_address: email.email,
        ...properties,
      },
      postConfig
    );

    return response.data;
  }

  private generateBearerToken(token: string): string {
    /*
      source: https://docs.notifications.service.gov.uk/rest-api.html

      JSON Web Tokens have a standard header and a payload. The header consists of:
        {
          "typ": "JWT",
          "alg": "HS256"
        }
      The payload consists of:
        {
          "iss": "26785a09-ab16-4eb0-8407-a37497a57506",
          "iat": 1568818578
        }

      JSON Web Tokens are encoded using a secret key with the following format:

        3d844edf-8d35-48ac-975b-e847b4f122b0

      That secret key forms a part of your API key, which follows the format {key_name}-{iss-uuid}-{secret-key-uuid}
      i.e.:
      if your API key is my_test_key-26785a09-ab16-4eb0-8407-a37497a57506-3d844edf-8d35-48ac-975b-e847b4f122b0

      then:
       iss = 26785a09-ab16-4eb0-8407-a37497a57506
       secret = 3d844edf-8d35-48ac-975b-e847b4f122b0

    */

    // the combination between iss and secret must be 72 + 1 (the '-' character that separates both)
    if (!token || token.length < 73) {
      throw new InvalidAPIKey("Invalid Notify Api Key.");
    }

    const issAndSecret = token.replace(
      `${config.default.get("email.api_key_name")}-`,
      ""
    );

    // gets iss which is the character chain between index 0 and has 36 of length
    const iss = issAndSecret.substring(0, 36);
    // gets the secret which is the character chain from position 37 onwards
    const secret = issAndSecret.substring(37);

    return jwt.sign({ iss }, secret, { algorithm: "HS256" });
  }

  private validateAndParseProps(
    template: EmailTemplate,
    props: EmailProps
  ): EmailProps | boolean {
    for (const key of Object.keys(template.props)) {
      if (!props[key]) return false;
      template.props[key] = props[key];
    }

    return template.props;
  }
}
