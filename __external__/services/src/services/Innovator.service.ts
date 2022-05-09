import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import {
  Innovation,
  InnovationStatus,
  InnovationTransferStatus,
  InnovatorOrganisationRole,
  Organisation,
  OrganisationType,
  OrganisationUser,
  User,
  UserType,
} from "@domain/index";
import { RequestUser } from "@services/models/RequestUser";
import { Connection, getConnection } from "typeorm";
import { TransactionResult } from "../models/InnovatorTransactionResult";
import { BaseService } from "./Base.service";
import { InnovationService } from "./Innovation.service";
import { InnovationTransferService } from "./InnovationTransfer.service";
import { LoggerService } from "./Logger.service";
import { NotificationService } from "./Notification.service";
import { UserService } from "./User.service";

export class InnovatorService extends BaseService<User> {
  private readonly connection: Connection;
  private readonly innovationTransferService: InnovationTransferService;
  private readonly innovationService: InnovationService;
  private readonly userService: UserService;
  private readonly notificationService: NotificationService;
  private readonly logService: LoggerService;

  constructor(connectionName?: string) {
    super(User, connectionName);
    this.connection = getConnection(connectionName);
    this.innovationTransferService = new InnovationTransferService(
      connectionName
    );
    this.innovationService = new InnovationService(connectionName);
    this.userService = new UserService(connectionName);
    this.notificationService = new NotificationService(connectionName);
    this.logService = new LoggerService();
  }

  async create(user: User): Promise<User> {
    user.type = UserType.INNOVATOR;
    return super.create(user);
  }

  async findAll(filter?: any): Promise<User[]> {
    filter = filter || {};
    filter.type = UserType.INNOVATOR;

    return await this.repository.find(filter);
  }

  async createFirstTimeSignIn(
    innovator: User,
    innovation: Innovation,
    organisation: Organisation
  ): Promise<TransactionResult> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();
    let result: TransactionResult;

    try {
      innovator.type = UserType.INNOVATOR;
      const _innovator = await queryRunner.manager.save(innovator);
      innovation.owner = _innovator;
      innovation.createdBy = _innovator.id;
      innovation.updatedBy = _innovator.id;
      innovation.status = InnovationStatus.CREATED;

      organisation.type = OrganisationType.INNOVATOR;
      organisation.createdBy = _innovator.id;
      organisation.updatedBy = _innovator.id;

      const _organisation = await queryRunner.manager.save(organisation);
      const _innovation = await queryRunner.manager.save(innovation);

      const organisationUser: OrganisationUser = OrganisationUser.new({
        organisation: _organisation,
        user: _innovator,
        role: InnovatorOrganisationRole.INNOVATOR_OWNER,
        createdBy: _innovator.id,
        updatedBy: _innovator.id,
      });

      await queryRunner.manager.save(organisationUser);

      result = {
        user: {
          id: _innovator.id,
          type: _innovator.type,
        },
        organisation: _organisation,
        innovation: _innovation,
      };

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    await this.sendEmail(innovator);
    return result;
  }

  async sendEmail(innovator: User): Promise<void> {
    const requestUser: RequestUser = {
      id: innovator.id,
      externalId: innovator.externalId,
      type: UserType.INNOVATOR,
    };

    try {
      await this.notificationService.sendEmail(
        requestUser,
        EmailNotificationTemplate.INNOVATORS_ACCOUNT_CREATED,
        null,
        innovator.id,
        [innovator.id],
        {
          innovation_service_url: process.env.CLIENT_WEB_BASE_URL,
        }
      );
    } catch (error) {
      this.logService.error(
        `An error has occured while sending an email with the template ${EmailNotificationTemplate.INNOVATORS_ACCOUNT_CREATED}.`,
        error
      );
    }
  }

  async createFirstTimeSignInTransfer(
    innovator: User,
    organisation: Organisation,
    transferId: string
  ) {
    await this.innovationTransferService.checkOne(transferId);

    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();
    let result: TransactionResult;

    try {
      innovator.type = UserType.INNOVATOR;
      const _innovator = await queryRunner.manager.save(innovator);

      organisation.type = OrganisationType.INNOVATOR;
      organisation.createdBy = _innovator.id;
      organisation.updatedBy = _innovator.id;

      const _organisation = await queryRunner.manager.save(organisation);

      const organisationUser: OrganisationUser = OrganisationUser.new({
        organisation: _organisation,
        user: _innovator,
        role: InnovatorOrganisationRole.INNOVATOR_OWNER,
        createdBy: _innovator.id,
        updatedBy: _innovator.id,
      });

      await queryRunner.manager.save(organisationUser);

      await queryRunner.commitTransaction();

      result = {
        user: {
          id: _innovator.id,
          type: _innovator.type,
        },
        organisation: _organisation,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    await this.innovationTransferService.updateStatus(
      {
        id: innovator.id,
        externalId: innovator.externalId,
        type: UserType.INNOVATOR,
      },
      transferId,
      InnovationTransferStatus.COMPLETED
    );

    return result;
  }

  async delete(requestUser: RequestUser, reason?: string) {
    const innovations = await this.innovationService.findAllByInnovator(
      requestUser
    );

    return await this.connection.transaction(async (transactionManager) => {
      try {
        for (const innovation of innovations) {
          await this.innovationService.archiveInnovation(
            requestUser,
            innovation.id,
            reason,
            transactionManager
          );
        }
        await this.userService.deleteAccount(requestUser);
        await transactionManager.update(
          User,
          { id: requestUser.id },
          {
            deletedAt: new Date(),
            deleteReason: reason,
          }
        );
      } catch (error) {
        throw error;
      }
    });
  }
}
