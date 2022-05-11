import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import {
  User,
  UserType,
  TouType,
  TermsOfUse,
  TermsOfUseUser,
} from "@domain/index";
import {
  InvalidParamsError,
  InvalidUserTypeError,
  UniqueKeyError,
} from "@services/errors";
import { RequestUser } from "@services/models/RequestUser";
import {
  Connection,
  EntityManager,
  getConnection,
  getRepository,
  Repository,
} from "typeorm";
import { BaseService } from "./Base.service";
import { LoggerService } from "./Logger.service";
import { NotificationService } from "./Notification.service";
import {
  TermsOfUseModel,
  TermsOfUseResult,
  TermsOfUseResultCreationModel,
} from "@services/models/TermsOfUseResult";

export class TermsOfUseService extends BaseService<TermsOfUse> {
  private readonly connection: Connection;
  private readonly logService: LoggerService;
  readonly termsOfUseUserRepo: Repository<TermsOfUseUser>;

  constructor(connectionName?: string) {
    super(TermsOfUse, connectionName);
    this.connection = getConnection(connectionName);
    this.logService = new LoggerService();
    this.termsOfUseUserRepo = getRepository(TermsOfUseUser, connectionName);
  }

  async createTermsOfUse(
    requestUser: RequestUser,
    touPaylod: TermsOfUseResultCreationModel
  ): Promise<TermsOfUseResult> {
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
        const tou = await trs.save(TermsOfUse, touObj);
        return tou;
      });
    } catch (error) {
      if (error.number === 2627) {
        throw new UniqueKeyError("Violation of UNIQUE KEY constraint");
      } else {
        throw new Error("Error creating TersOfUse");
      }
    }

    return {
      id: result.id,
      name: result.name,
      touType: result.touType,
      createdAt: result.createdAt,
    };
  }

  async updateTermsOfUse(
    requestUser: RequestUser,
    touPaylod: TermsOfUseResultCreationModel,
    touId: string
  ): Promise<TermsOfUseResult> {
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
          TermsOfUse,
          { id: touId },
          {
            name: touPaylod.name,
            summary: touPaylod.summary || "",
            touType: touPaylod.touType,
            releasedAt: touPaylod.releasedAt || null,
          }
        );
      });
    } catch (error) {
      if (error.number === 2627) {
        throw new UniqueKeyError("Violation of UNIQUE KEY constraint");
      } else {
        throw new Error("Error updating TersOfUse");
      }
    }
    return {
      id: result.id,
      name: result.name,
      touType: result.touType,
      releasedAt: result.releasedAt,
      createdAt: result.createdAt,
    };
  }

  async findTermsOfUseById(
    requestUser: RequestUser,
    Id: string
  ): Promise<TermsOfUseResult> {
    if (!requestUser || !Id) {
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

  async findAllTermsOfUse(
    requestUser: RequestUser,
    skip: number,
    take: number,
    order?: { [key: string]: string }
  ): Promise<TermsOfUseModel> {
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
      count: tou[1] as number,
    };
  }

  async acceptTermsOfUse(requestUser: RequestUser, touId: string) {
    if (!requestUser || !touId) {
      throw new Error("Invalid parameters");
    }

    const tou = await this.findTermsOfUseById(requestUser, touId);

    if (tou.releasedAt === null) {
      throw new Error("This Terms of Use have not been released yet");
    }

    if (
      requestUser.type === UserType.ACCESSOR ||
      requestUser.type === UserType.ASSESSMENT
    ) {
      if (tou.touType !== "SUPPORT_ORGANISATION") {
        throw new Error("Invalid Terms of Use for this user");
      }
    }

    if (requestUser.type === UserType.INNOVATOR) {
      if (tou.touType !== "INNOVATOR") {
        throw new Error("Invalid Terms of Use for this user");
      }
    }

    try {
      //Check if User has already accepted this Terms of Use
      if (
        await this.termsOfUseUserRepo.findOne({
          where: {
            termsOfUse: touId,
            user: requestUser.id,
          },
        })
      ) {
        return;
      }

      await this.connection.transaction(
        async (transactionManager: EntityManager) => {
          const termsOfUseUser = TermsOfUseUser.new({
            termsOfUse: touId,
            user: requestUser.id,
            acceptedAt: new Date(),
          });

          await transactionManager.save(TermsOfUseUser, termsOfUseUser);
        }
      );
    } catch (error) {
      throw new Error(error);
    }

    return "Terms Accepted";
  }
}
