import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import { UserEmailNotFound } from "@services/errors";
import { UserEmailModel } from "@services/models/ProfileSlimModel";
import { SLSEventType } from "@services/types";
import * as crypto from "crypto";
import { TTL2ls } from "../../../../schemas/TTL2ls";
import { EmailService } from "./Email.service";
import { LoggerService } from "./Logger.service";
import { UserService } from "./User.service";

export class AuthService {
  private readonly userService: UserService;
  private readonly emailService: EmailService;
  private readonly loggerService: LoggerService;

  constructor(connectionName: string) {
    this.userService = new UserService(connectionName);
    this.emailService = new EmailService(connectionName);
    this.loggerService = new LoggerService();
  }
  async send2LS(userId: string, eventType: SLSEventType) {
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
    const persistedCode = await TTL2ls.findOneAndUpdate(
      { userId, eventType },
      { code: hashedCode, eventType, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // send email to user with 6 digit code
    try {
      await this.sendTOTP(user, code);
    } catch (error) {
      this.loggerService.error("Error sending TOTP", error);
    }

    return { code, id: persistedCode?.get("_id").toString() };
  }

  async validate2LS(
    userId: string,
    eventType: SLSEventType,
    code?: string,
    id?: string
  ): Promise<boolean> {
    // get 6 digit code from document store for this user
    // if it exists, compare it
    // if it matches, return true

    if (!code) {
      // code already validated for this operation
      // do not resend and let the operation to carry through
      const totp = await TTL2ls.findOne({ userId, eventType });
      return totp && totp.validatedAt;
    }

    const ttlCode = await TTL2ls.findOne({ userId, _id: id, eventType });

    if (!ttlCode) return false;

    const verified = !ttlCode.validatedAt
      ? await this.verify(code, ttlCode.code)
      : true;

    if (verified) {
      await TTL2ls.findByIdAndUpdate(id, { validatedAt: new Date() });
    }

    return verified;
  }

  async totpExists(userId: string, eventType: string, id: string) {
    const ttlCode = await TTL2ls.findOne({ userId, eventType, id });
    return ttlCode;
  }

  async sendTOTP(recipient: UserEmailModel, code: string) {
    return await this.emailService.sendOne(
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
}
