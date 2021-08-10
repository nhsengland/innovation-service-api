import { InnovationTransfer } from "@domain/entity/innovation/InnovationTransfer.entity";
import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import { InnovationTransferStatus } from "@domain/index";
import {
  InnovationNotFoundError,
  InnovationTransferAlreadyExistsError,
  InnovationTransferNotFoundError,
  InvalidParamsError,
} from "@services/errors";
import { InnovationTransferResult } from "@services/models/InnovationTransferResult";
import { RequestUser } from "@services/models/RequestUser";
import { Connection, getConnection, getRepository, Repository } from "typeorm";
import {
  authenticateWitGraphAPI,
  checkIfValidUUID,
  getUserFromB2C,
  getUserFromB2CByEmail,
} from "../helpers";
import { InnovationService } from "./Innovation.service";
import { LoggerService } from "./Logger.service";
import { NotificationService } from "./Notification.service";

interface findOneFilter {
  id?: string;
  status?: InnovationTransferStatus;
  innovationId?: string;
}

export class InnovationTransferService {
  private readonly connection: Connection;
  private readonly transferRepo: Repository<InnovationTransfer>;
  private readonly innovationService: InnovationService;
  private readonly notificationService: NotificationService;
  private readonly logService: LoggerService;

  constructor(connectionName?: string) {
    this.connection = getConnection(connectionName);
    this.transferRepo = getRepository(InnovationTransfer, connectionName);
    this.innovationService = new InnovationService(connectionName);
    this.notificationService = new NotificationService(connectionName);
    this.logService = new LoggerService();
  }

  async checkOne(id: string) {
    if (!id || !checkIfValidUUID(id)) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const transfer = await this.getOne({ id });
    if (!transfer) {
      throw new InnovationTransferNotFoundError(
        "Innovation trasnfer not found."
      );
    }

    const b2cUser = await getUserFromB2CByEmail(transfer.email);

    return {
      userExists: !!b2cUser,
    };
  }

  async findOne(
    requestUser: RequestUser,
    id: string
  ): Promise<InnovationTransferResult> {
    if (!requestUser || !id || !checkIfValidUUID(id)) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const transfer = await this.getOne({ id });
    if (!transfer) {
      throw new InnovationTransferNotFoundError(
        "Innovation trasnfer not found."
      );
    }

    const result: InnovationTransferResult = {
      id: transfer.id,
      email: transfer.email,
      innovation: {
        id: transfer.innovation.id,
        name: transfer.innovation.name,
      },
    };

    if (requestUser.id !== transfer.createdBy) {
      const b2cUser = await getUserFromB2C(transfer.createdBy);

      result.innovation.owner = b2cUser.displayName;
    }

    return result;
  }

  async findAll(
    requestUser: RequestUser,
    assignedToMe?: boolean
  ): Promise<InnovationTransferResult[]> {
    if (!requestUser) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    let email: string = null;
    let graphAccessToken: string;

    if (assignedToMe) {
      const graphAccessToken = await authenticateWitGraphAPI();
      const b2cUser = await getUserFromB2C(requestUser.id, graphAccessToken);

      email = b2cUser.identities.find(
        (identity: any) => identity.signInType === "emailAddress"
      ).issuerAssignedId;
    }

    const transfers = await this.getMany(
      requestUser,
      InnovationTransferStatus.PENDING,
      email
    );

    const result: InnovationTransferResult[] = [];
    for (let i = 0; i < transfers.length; i++) {
      const transfer = transfers[i];

      const obj: InnovationTransferResult = {
        id: transfer.id,
        email: transfer.email,
        innovation: {
          id: transfer.innovation.id,
          name: transfer.innovation.name,
        },
      };

      if (assignedToMe) {
        const b2cUser = await getUserFromB2C(
          transfer.createdBy,
          graphAccessToken
        );
        obj.innovation.owner = b2cUser.displayName;
      }

      result.push(obj);
    }

    return result;
  }

  async create(
    requestUser: RequestUser,
    innovationId: string,
    email: string
  ): Promise<InnovationTransferResult> {
    if (!requestUser || !innovationId || !checkIfValidUUID(innovationId)) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const innovation = await this.innovationService.findInnovation(
      requestUser,
      innovationId
    );
    if (!innovation) {
      throw new InnovationNotFoundError("Innovation not found for the user.");
    }

    const currentTransfer = await this.getOne({ innovationId: innovation.id });
    if (currentTransfer) {
      throw new InnovationTransferAlreadyExistsError(
        "Transfer already exists."
      );
    }

    const b2cUser = await getUserFromB2CByEmail(email);
    if (b2cUser && b2cUser.id === requestUser.id) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const emailTemplate: EmailNotificationTemplate = b2cUser
      ? EmailNotificationTemplate.INNOVATORS_TRANSFER_OWNERSHIP_EXISTING_USER
      : EmailNotificationTemplate.INNOVATORS_TRANSFER_OWNERSHIP_NEW_USER;

    return await this.connection.transaction(async (transactionManager) => {
      const transferObj = InnovationTransfer.new({
        email,
        emailCount: 1,
        status: InnovationTransferStatus.PENDING,
        innovation: { id: innovation.id },
        createdBy: requestUser.id,
        updatedBy: requestUser.id,
      });

      const result = await transactionManager.save(
        InnovationTransfer,
        transferObj
      );

      // TODO : Enable emails
      // try {
      //   await this.notificationService.sendEmail(
      //     requestUser,
      //     emailTemplate,
      //     innovation.id,
      //     result.id,
      //     [email]
      //   );
      // } catch (error) {
      //   this.logService.error(
      //     `An error has occured while sending an email with template ${emailTemplate} from ${requestUser.id}`,
      //     error
      //   );

      //   throw error;
      // }

      return {
        id: result.id,
        email: result.email,
        innovation: {
          id: innovation.id,
          name: innovation.name,
        },
      };
    });
  }

  private async getMany(
    requestUser: RequestUser,
    status: InnovationTransferStatus,
    email?: string
  ): Promise<InnovationTransfer[]> {
    const query = this.transferRepo
      .createQueryBuilder("innovationTransfer")
      .innerJoinAndSelect("innovationTransfer.innovation", "innovation");

    if (email) {
      query.where("innovationTransfer.email = :email", {
        email,
      });
    } else {
      query.where("innovationTransfer.created_by = :createdBy", {
        createdBy: requestUser.id,
      });
    }

    if (status) {
      query.andWhere("innovationTransfer.status = :status", {
        status,
      });
    }

    return await query.getMany();
  }

  private async getOne(filter: findOneFilter): Promise<InnovationTransfer> {
    const query = this.transferRepo
      .createQueryBuilder("innovationTransfer")
      .innerJoinAndSelect("innovationTransfer.innovation", "innovation")
      .where("innovationTransfer.deleted_at is null");

    if (filter.id) {
      query.andWhere("innovationTransfer.id = :id", {
        id: filter.id,
      });
    }

    if (filter.status) {
      query.andWhere("innovationTransfer.status = :status", {
        status: filter.status,
      });
    }

    if (filter.innovationId) {
      query.andWhere("innovationTransfer.innovation_id = :innovationId", {
        innovationId: filter.innovationId,
      });
    }

    return await query.getOne();
  }
}
