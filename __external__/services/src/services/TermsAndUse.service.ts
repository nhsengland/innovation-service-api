import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import { User, UserType, TouType, TermsAndUse } from "@domain/index";
import {
  InvalidParamsError,
  InvalidUserTypeError,
  UniqueKeyError,
} from "@services/errors";
import { RequestUser } from "@services/models/RequestUser";
import { Connection, getConnection } from "typeorm";
import { BaseService } from "./Base.service";
import { LoggerService } from "./Logger.service";
import { NotificationService } from "./Notification.service";
import {
  TermsAndUseModel,
  TermsAndUseResult,
  TermsAndUseResultCreationModel,
} from "@services/models/TermsAndUseResult";
import { id } from "inversify";
import { name } from "faker";

export class TermsAndUseService extends BaseService<TermsAndUse> {
  private readonly connection: Connection;
  private readonly logService: LoggerService;

  constructor(connectionName?: string) {
    super(TermsAndUse, connectionName);
    this.connection = getConnection(connectionName);
    this.logService = new LoggerService();
  }

  async createTermsandUse(
    requestUser: RequestUser,
    touPaylod: TermsAndUseResultCreationModel
  ): Promise<TermsAndUseResult> {
    let result;
    if (!requestUser || !touPaylod.name) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    if (requestUser.type !== UserType.ADMIN) {
      throw new InvalidUserTypeError("Invalid user type.");
    }

    const touObj = {
      name: touPaylod.name,
      summary: touPaylod.summary || "",
      touType: touPaylod.touType,
      createdBy: requestUser.id,
      updatedBy: requestUser.id,
      releasedAt: touPaylod.releasedAt || null,
    };
    try {
      result = await this.connection.transaction(async (trs) => {
        const tou = await trs.save(TermsAndUse, touObj);
        return tou;
      });
    } catch (error) {
      if (error.number === 2627) {
        throw new UniqueKeyError("Violation of UNIQUE KEY constraint");
      }
    }

    return {
      id: result.id,
      name: result.name,
      touType: result.touType,
      createdAt: result.createdAt,
    };
  }

  async updateTermsandUse(
    requestUser: RequestUser,
    touPaylod: TermsAndUseResultCreationModel,
    touId: string
  ): Promise<TermsAndUseResult> {
    let result;
    if (!requestUser || !touPaylod.name) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    if (requestUser.type !== UserType.ADMIN) {
      throw new InvalidUserTypeError("Invalid user type.");
    }

    try {
      await this.connection.transaction(async (transaction) => {
        result = await transaction.update(
          TermsAndUse,
          { id: touId },
          {
            name: touPaylod.name,
            summary: touPaylod.summary || "",
            touType: touPaylod.touType,
            releasedAt: touPaylod.releasedAt || null,
          }
        );
      });
    } catch {
      throw new Error("Error updating TersOfUse");
    }
    return {
      id: result.id,
      name: result.name,
      touType: result.touType,
      releasedAt: result.releasedAt,
      createdAt: result.createdAt,
    };
  }

  async findTermsAndUseById(
    requestUser: RequestUser,
    Id: string
  ): Promise<TermsAndUseResult> {
    if (!Id) {
      throw new InvalidParamsError("Invalid parameters.");
    }
    const tou = await this.repository
      .createQueryBuilder("terms_and_use")
      .where("terms_and_use.id = :id", {
        id: Id,
      })
      .getOne();

    return {
      id: tou.id,
      name: tou.name,
      touType: tou.touType,
      summary: tou.summary,
      releasedAt: tou.releasedAt,
      createdAt: tou.createdAt,
    };
  }

  async findAllTermsAndUse(
    requestUser: RequestUser,
    skip: number,
    take: number,
    order?: { [key: string]: string }
  ): Promise<TermsAndUseModel> {
    const filterOptions = {
      where: {},
      skip,
      take,
      order: order || { createdAt: "DESC" },
    };

    const tou = await this.repository.findAndCount(filterOptions);

    // If no records = quick return
    if (tou[1] === 0) {
      return {
        data: [],
        count: 0,
      };
    }

    return {
      data: tou[0]?.map((tu: any) => {
        return {
          id: tu.id,
          name: tu.name,
          touType: tu.TouType,
          summary: tu.summary,
          releasedAt: tu.releasedAt,
          createdAt: tu.createdAt,
        };
      }),
      count: tou.length as number,
    };
  }
}
