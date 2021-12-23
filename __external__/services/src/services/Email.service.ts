import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import { getTemplates } from "@engines/templates/index";
import {
  EmailTemplateNotFound,
  InvalidAPIKey,
  InvalidEmailTemplateProps,
  InvalidUserRoleError,
  UserEmailNotFound,
} from "@services/errors";
import { UserEmailModel } from "@services/models/ProfileSlimModel";
import { RequestUser } from "@services/models/RequestUser";
import axios from "axios";
import * as jwt from "jsonwebtoken";
import { TTL2ls } from "../../../../schemas/TTL2ls";
import * as uuid from "uuid";
import { LoggerService } from "./Logger.service";
import { UserService } from "./User.service";
import * as crypto from "crypto";

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

export type ValidationResult = {
  data: EmailProps;
  errors: string[];
};

export type EmailProps = {
  [key: string]: string;
};

export type EmailTemplate = {
  id: string;
  code: string;
  path?: { url: string; params: { [key: string]: string } };
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
  private readonly loggerService: LoggerService;
  constructor(connectionName?: string) {
    this.userService = new UserService(connectionName);
    this.loggerService = new LoggerService();
  }

  async sendOne(
    recipient: UserEmailModel,
    templateCode: string,
    props?: EmailProps
  ) {
    const template = getTemplates().find((t) => t.code === templateCode);
    if (!template) {
      throw new EmailTemplateNotFound(
        `Could not find a template with the code ${templateCode}`
      );
    }

    const validProps = this.validateAndParseProps(template, props);
    if (validProps.errors.length > 0) {
      throw new InvalidEmailTemplateProps(validProps.errors.join(";"));
    }

    const response = await this.send(recipient.email, template.id, validProps);

    return response;
  }

  async sendMany(
    recipientIds: string[],
    templateCode: string,
    props?: EmailProps
  ): Promise<EmailResponse[]> {
    const template = getTemplates().find((t) => t.code === templateCode);
    if (!template)
      throw new EmailTemplateNotFound(
        `Could not find a template with the code ${templateCode}`
      );

    props = {
      ...props,
      display_name: "temp",
    };

    const validProps = this.validateAndParseProps(template, props);
    if (validProps.errors.length > 0)
      throw new InvalidEmailTemplateProps(validProps.errors.join(";"));

    const recipients: UserEmailModel[] = await this.userService.getUsersEmail(
      recipientIds
    );

    if (recipients.length === 0) return;

    const result: EmailResponse[] = [];

    for (const recipient of recipients) {
      validProps.data.display_name = recipient.displayName;

      const response = await this.send(
        recipient.email,
        template.id,
        validProps
      );
      if (response) result.push(response);
    }
    // replaces temp token with actual recipient display name

    return result;
  }

  async send2LS(userId: string): Promise<string> {
    const userEmails = await this.userService.getUsersEmail([userId]);

    if (userEmails.length === 0) {
      throw new UserEmailNotFound("User has no emails");
    }

    // grab first email if more than one
    const user = userEmails[0];

    // generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await this.hash(code);
    // persist it to TTL document
    await TTL2ls.findOneAndUpdate(
      { userId },
      { code: hashedCode, createdAt: new Date() },
      { upsert: true }
    );

    // send email to user with 6 digit code
    await this.sendTOTP(user, code);

    return code;
  }

  async validate2LS(userId: string, code: string): Promise<boolean> {
    // get 6 digit code from document store for this user
    // if it exists, compare it
    // if it matches, return true

    const ttlCode = await TTL2ls.findOne({ userId });

    if (!ttlCode) return false;

    return await this.verify(code, ttlCode.code);
  }

  async totpExists(userId: string): Promise<boolean> {
    const ttlCode = await TTL2ls.findOne({ userId });
    if (ttlCode) return true;
    return false;
  }

  async sendTOTP(recipient: UserEmailModel, code: string) {
    await this.sendOne(
      recipient,
      EmailNotificationTemplate.ADMINS_LOGIN_VALIDATION,
      {
        display_name: "temp",
        code,
      }
    );
  }

  async hash(password) {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString("hex");

      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(salt + ":" + derivedKey.toString("hex"));
      });
    });
  }

  async verify(password, hash): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const [salt, key] = hash.split(":");
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(key === derivedKey.toString("hex"));
      });
    });
  }

  private async send(
    recipientEmail: string,
    templateId: string,
    validProps: any
  ) {
    const reference = uuid.v4();

    const properties: NotifyClientParams = {
      personalisation: { ...validProps.data },
      reference,
    };

    const jwtToken = this.generateBearerToken();

    const postConfig = {
      headers: { Authorization: `Bearer ${jwtToken}` },
    };

    const baseUrl = process.env.EMAIL_NOTIFICATION_API_BASE_URL;
    const emailPath = process.env.EMAIL_NOTIFICATION_API_EMAIL_PATH;
    const url = `${baseUrl}${emailPath}`;

    const response = await axios.post(
      url,
      {
        template_id: templateId,
        email_address: recipientEmail,
        ...properties,
      },
      postConfig
    );

    this.loggerService.log(`An email was sent with template ${templateId}`, 1, {
      email_address: recipientEmail,
      template_id: templateId,
      response: response.data,
    });

    if (response && response.data) {
      return response.data;
    }
  }

  private generateBearerToken(): string {
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

    const iss = process.env.EMAIL_NOTIFICATION_API_ISSUER;
    const secret = process.env.EMAIL_NOTIFICATION_API_SECRET;

    if (!iss) throw new InvalidAPIKey("Invalid EMAIL API Issuer");
    if (!secret) throw new InvalidAPIKey("Invalid EMAIL API Secret");

    return jwt.sign({ iss }, secret, { algorithm: "HS256" });
  }

  private validateAndParseProps(
    template: EmailTemplate,
    props: EmailProps
  ): ValidationResult {
    const errors: string[] = [];

    for (const key of Object.keys(template.props)) {
      if (!props[key]) errors.push(`${key} is missing or invalid.`);
      template.props[key] = props[key];
    }

    const result: ValidationResult = {
      errors: errors,
      data: template.props,
    };

    return result;
  }
}
