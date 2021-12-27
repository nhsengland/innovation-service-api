import { UserService } from "./User.service";
import * as crypto from "crypto";
import { TTL2ls } from "../../../../schemas/TTL2ls";
import { EmailService } from "./Email.service";
import { UserEmailModel } from "@services/models/ProfileSlimModel";
import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import { UserEmailNotFound } from "@services/errors";
import { LoggerService } from "./Logger.service";

export class AuthService {
  private readonly userService: UserService;
  private readonly emailService: EmailService;
  private readonly loggerService: LoggerService;

  constructor(connectionName: string) {
    this.userService = new UserService(connectionName);
    this.emailService = new EmailService(connectionName);
    this.loggerService = new LoggerService();
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
    try {
      await this.sendTOTP(user, code);
    } catch (error) {
      this.loggerService.error("Error sending TOTP", error);
    }

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

  async totpExists(userId: string, action: string, id?: string) {
    const ttlCode = await TTL2ls.findOne({ userId, action, id });
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
