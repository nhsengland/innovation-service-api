import { NotificationActionType } from "@domain/enums/notification.enums";
import {
  Innovation,
  InnovationSection,
  InnovationSectionCatalogue,
  InnovationSectionStatus,
  InnovationStatus,
  InnovationTransferStatus,
  InnovatorOrganisationRole,
  Organisation,
  OrganisationType,
  OrganisationUser,
  User,
  UserType,
} from "@domain/index";
import { InvalidParamsError } from "@services/errors";
import { RequestUser } from "@services/models/RequestUser";
import { Connection, EntityManager, getConnection } from "typeorm";
import { QueueProducer } from "../../../../utils/queue-producer";
import { TransactionResult } from "../models/InnovatorTransactionResult";
import { BaseService } from "./Base.service";
import { InnovationService } from "./Innovation.service";
import { InnovationTransferService } from "./InnovationTransfer.service";
import { LoggerService } from "./Logger.service";
import { UserService } from "./User.service";

export class InnovatorService extends BaseService<User> {
  private readonly connection: Connection;
  private readonly innovationTransferService: InnovationTransferService;
  private readonly innovationService: InnovationService;
  private readonly userService: UserService;
  private readonly logService: LoggerService;
  private readonly queueProducer: QueueProducer;

  constructor(connectionName?: string) {
    super(User, connectionName);
    this.connection = getConnection(connectionName);
    this.innovationTransferService = new InnovationTransferService(
      connectionName
    );
    this.innovationService = new InnovationService(connectionName);
    this.userService = new UserService(connectionName);
    this.logService = new LoggerService();
    this.queueProducer = new QueueProducer();
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
      try {
        await this.saveSection(
          _innovation,
          [
            InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
            InnovationSectionCatalogue.VALUE_PROPOSITION,
            InnovationSectionCatalogue.UNDERSTANDING_OF_BENEFITS,
            InnovationSectionCatalogue.EVIDENCE_OF_EFFECTIVENESS,
            InnovationSectionCatalogue.MARKET_RESEARCH,
            InnovationSectionCatalogue.TESTING_WITH_USERS,
          ],
          queryRunner.manager
        );
      } catch (error) {
        this.logService.error(
          `An error has occured while creating section from InnovationID ${_innovation.id}`,
          error
        );
        throw error;
      }
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
    try {
      // send email: to innovator
      await this.queueProducer.sendNotification(
        NotificationActionType.INNOVATOR_ACCOUNT_CREATION,
        {
          id: innovator.id,
          identityId: innovator.externalId,
          type: UserType.INNOVATOR,
        }
      );
    } catch (error) {
      this.logService.error(
        `An error has occured while writing notification on queue of type ${NotificationActionType.INNOVATOR_ACCOUNT_CREATION}`,
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

  async saveSection(
    innovation: Innovation,
    sections: InnovationSectionCatalogue[],
    queryRunner: EntityManager
  ) {
    if (!innovation) {
      throw new InvalidParamsError("Invalid parameters.");
    }
    let result;

    for (let i = 0; i < sections.length; i++) {
      const secKey = sections[i];
      const innovationSection = InnovationSection.new({
        innovation,
        section: InnovationSectionCatalogue[secKey],
        status: InnovationSectionStatus.DRAFT,
        createdBy: innovation.createdBy,
        updatedBy: innovation.updatedBy,
      });

      result = await queryRunner.save(InnovationSection, innovationSection);
    }
    return result;
  }
}
