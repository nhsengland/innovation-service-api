import { NotificationActionType } from "@domain/enums/notification.enums";
import {
  Activity,
  Innovation,
  InnovationSupportLog,
  InnovationSupportLogType,
  InnovationSupportStatus,
  OrganisationUnit,
} from "@domain/index";
import {
  InnovationNotFoundError,
  InvalidParamsError,
  MissingUserOrganisationError,
  MissingUserOrganisationUnitError,
} from "@services/errors";
import { checkIfValidUUID } from "@services/helpers";
import { InnovationSupportLogModel } from "@services/models/InnovationSupportLogModel";
import { RequestUser } from "@services/models/RequestUser";
import { Connection, getConnection, getRepository, Repository } from "typeorm";
import { QueueProducer } from "utils/queue-producer";
import { ActivityLogService } from "./ActivityLog.service";
import { InnovationService } from "./Innovation.service";
import { LoggerService } from "./Logger.service";
import { UserService } from "./User.service";

export class InnovationSupportLogService {
  private readonly connection: Connection;
  private readonly supportLogRepo: Repository<InnovationSupportLog>;
  private readonly innovationService: InnovationService;
  private readonly userService: UserService;
  private readonly loggerService: LoggerService;
  private readonly activityLogService: ActivityLogService;
  private readonly organisationUnitRepo: Repository<OrganisationUnit>;
  private readonly queueProducer: QueueProducer;

  constructor(connectionName?: string) {
    this.connection = getConnection(connectionName);
    this.supportLogRepo = getRepository(InnovationSupportLog, connectionName);
    this.innovationService = new InnovationService(connectionName);
    this.userService = new UserService(connectionName);
    this.loggerService = new LoggerService();
    this.activityLogService = new ActivityLogService(connectionName);
    this.organisationUnitRepo = getRepository(OrganisationUnit, connectionName);
    this.queueProducer = new QueueProducer();
  }

  async create(
    requestUser: RequestUser,
    innovationId: string,
    supportLog: any,
    innovation?: Innovation
  ) {
    if (!requestUser || !innovationId || !supportLog) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    if (!supportLog.type) {
      throw new InvalidParamsError("Invalid parameters. Missing type.");
    }

    if (!requestUser.organisationUser) {
      throw new MissingUserOrganisationError(
        "Invalid user. User has no organisations."
      );
    }

    if (!requestUser.organisationUnitUser) {
      throw new MissingUserOrganisationUnitError(
        "Invalid user. User has no organisation units."
      );
    }

    if (!innovation) {
      const filterOptions = {
        relations: [
          "innovationSupports",
          "innovationSupports.organisationUnit",
        ],
      };

      innovation = await this.innovationService.findInnovation(
        requestUser,
        innovationId,
        filterOptions
      );
      if (!innovation) {
        throw new InnovationNotFoundError(
          "Invalid parameters. Innovation not found for the user."
        );
      }
    }

    const organisationUnitId =
      requestUser.organisationUnitUser.organisationUnit.id;

    let innovationSupportStatus: InnovationSupportStatus;
    if (supportLog.innovationSupportStatus) {
      innovationSupportStatus = supportLog.innovationSupportStatus;
    } else {
      const innovationSupport = innovation.innovationSupports.find(
        (sup) => sup.organisationUnit.id === organisationUnitId
      );

      innovationSupportStatus =
        innovationSupport && innovationSupport.status
          ? innovationSupport.status
          : InnovationSupportStatus.UNASSIGNED;
    }

    const supportLogObj = InnovationSupportLog.new({
      innovation: { id: innovationId },
      organisationUnit: { id: organisationUnitId },
      innovationSupportStatus,
      description: supportLog.description,
      type: supportLog.type,
      suggestedOrganisationUnits: supportLog?.organisationUnits?.map(
        (id: string) => ({
          id,
        })
      ),
      createdBy: requestUser.id,
      updatedBy: requestUser.id,
    });

    const result = await this.connection.transaction(async (trs) => {
      const supportLogResult = await trs.save(supportLogObj);
      if (
        supportLog.type === InnovationSupportLogType.ACCESSOR_SUGGESTION &&
        supportLog?.organisationUnits &&
        supportLog?.organisationUnits.length > 0
      ) {
        const orgUnits = await this.organisationUnitRepo.findByIds(
          supportLog?.organisationUnits
        );

        try {
          await this.activityLogService.createLog(
            requestUser,
            innovation,
            Activity.ORGANISATION_SUGGESTION,
            trs,
            {
              organisations: orgUnits.map((ou) => ou.name),
            }
          );
        } catch (error) {
          this.loggerService.error(
            `An error has occured while creating activity log from ${requestUser.id}`,
            error
          );

          throw error;
        }
      }

      return supportLogResult;
    });

    if (
      supportLog?.organisationUnits &&
      supportLog.type === InnovationSupportLogType.ACCESSOR_SUGGESTION
    ) {
      // send email: to suggested organisation units
      try {
        await this.queueProducer.sendMessage({
          data: {
            action: NotificationActionType.QA_INNOVATION_SUGGESTION,
            body: {
              innovationId: innovationId,
              contextId: innovationId, // innovationId
              requestUser: {
                id: requestUser.id,
                identityId: requestUser.externalId,
                type: requestUser.type,
              },
              organisationUnitIds: supportLog.organisationUnits,
            },
          },
        });
      } catch (error) {
        this.loggerService.error(
          `An error has occured while writing notification on queue of type ${NotificationActionType.QA_INNOVATION_SUGGESTION}`,
          error
        );
      }
    }

    return result;
  }

  async findAllByInnovation(
    requestUser: RequestUser,
    innovationId: string,
    type?: InnovationSupportLogType
  ) {
    if (!requestUser || !innovationId || !checkIfValidUUID(innovationId)) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const innovation = await this.innovationService.findInnovation(
      requestUser,
      innovationId
    );
    if (!innovation) {
      throw new InnovationNotFoundError(
        "Invalid parameters. Innovation not found for the user."
      );
    }

    const innovationLogs: InnovationSupportLog[] = await this.findMany(
      innovationId,
      type
    );

    const userIds = innovationLogs.map(
      (sup: InnovationSupportLog) => sup.createdBy
    );
    const b2cUsers = await this.userService.getListOfUsers(userIds);
    const b2cUserNames = b2cUsers.reduce((map, obj) => {
      map[obj.id] = obj.displayName;
      return map;
    }, {});

    const response: InnovationSupportLogModel[] = innovationLogs.map((log) => {
      const rec: InnovationSupportLogModel = {
        id: log.id,
        type: log.type,
        description: log.description,
        innovationSupportStatus: log.innovationSupportStatus,
        createdBy: b2cUserNames[log.createdBy],
        createdAt: log.createdAt,
      };

      if (log.organisationUnit) {
        rec.organisationUnit = {
          id: log.organisationUnit.id,
          name: log.organisationUnit.name,
          acronym: log.organisationUnit.acronym || "",
          organisation: {
            id: log.organisationUnit.organisation.id,
            name: log.organisationUnit.organisation.name,
            acronym: log.organisationUnit.organisation.acronym || "",
          },
        };
      }

      if (
        log.suggestedOrganisationUnits &&
        log.suggestedOrganisationUnits.length > 0
      ) {
        rec.suggestedOrganisationUnits = log.suggestedOrganisationUnits.map(
          (orgUnit) => ({
            id: orgUnit.id,
            name: orgUnit.name,
            acronym: orgUnit.acronym,
            organisation: {
              id: orgUnit.organisation.id,
              name: orgUnit.organisation.name,
              acronym: orgUnit.organisation.acronym,
            },
          })
        );
      }

      return rec;
    });

    return response;
  }

  async findMany(innovationId: string, type?: InnovationSupportLogType) {
    const query = await this.supportLogRepo
      .createQueryBuilder("innovationSupportLog")
      .leftJoinAndSelect(
        "innovationSupportLog.organisationUnit",
        "organisationUnit"
      )
      .leftJoinAndSelect("organisationUnit.organisation", "organisation")
      .leftJoinAndSelect(
        "innovationSupportLog.suggestedOrganisationUnits",
        "suggestedOrganisationUnits"
      )
      .leftJoinAndSelect(
        "suggestedOrganisationUnits.organisation",
        "suggestedOrganisation"
      )
      .where("innovation_id = :innovationId", {
        innovationId: innovationId,
      });

    if (type) {
      query.andWhere("innovationSupportLog.type = :type", {
        type,
      });
    }

    query.orderBy("innovationSupportLog.createdAt", "ASC");

    return query.getMany();
  }
}
