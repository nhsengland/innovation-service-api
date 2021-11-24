import { Activity, ActivityType } from "@domain/enums/activity.enums";
import { ActivityLog, Innovation } from "@domain/index";
import { InvalidParamsError } from "@services/errors";
import { checkIfValidUUID } from "@services/helpers";
import { ActivityLogModel } from "@services/models/ActivityLogModel";
import { RequestUser } from "@services/models/RequestUser";
import {
  Connection,
  EntityManager,
  getConnection,
  getRepository,
  Repository,
} from "typeorm";
import { LoggerService } from "./Logger.service";
import { UserService } from "./User.service";

export class ActivityLogService {
  private readonly connection: Connection;
  private readonly activityLogRepo: Repository<ActivityLog>;
  private readonly loggerService: LoggerService;
  private readonly userService: UserService;

  constructor(connectionName?: string) {
    this.connection = getConnection(connectionName);
    this.activityLogRepo = getRepository(ActivityLog, connectionName);
    this.loggerService = new LoggerService();
    this.userService = new UserService(connectionName);
  }

  async getInnovationActivitiesById(
    requestUser: RequestUser,
    innovationId: string,
    take: number,
    skip: number,
    activityTypes: string,
    order?: { [key: string]: string }
  ) {
    if (!requestUser || !innovationId || !checkIfValidUUID(innovationId)) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const activityLogs: ActivityLog[] = await this.findMany(
      innovationId,
      take,
      skip,
      activityTypes,
      order
    );

    const userIds = [];
    activityLogs.forEach(
      (res: ActivityLog) => {

        let obj = JSON.parse(res.param);
        if (obj) {
          if (obj.hasOwnProperty('actionUserId') && userIds.indexOf(obj['actionUserId']) === -1) {
            userIds.push(obj['actionUserId']);
          }
          if (obj.hasOwnProperty('interveningUserId')  && userIds.indexOf(obj['actionUserId']) === -1) {
            userIds.push(obj['interveningUserId']);
          }
        }
      }
    );

    const b2cUsers = await this.userService.getListOfUsers(userIds);
    const b2cUserNames = b2cUsers.reduce((map, obj) => {
      map[obj.id] = obj.displayName;
      return map;
    }, {});

    const response: ActivityLogModel[] = activityLogs.map((log) => {
      const rec: ActivityLogModel = {
        id: log.id,
        createdAt: log.createdAt,
        type: log.type,
        activity: log.activity,
        params: JSON.parse(log.param),
      };

      return rec;
    });

    response.forEach(log => {
      let obj = log.params;
      if (obj) {
        if (obj['actionUserId']) {
          const name = b2cUserNames[obj['actionUserId']];
          obj['actionUserId'] = name;
          this.renameKey(obj, 'actionUserId', 'actionUserName')
        }
        if (obj['interveningUserId']) {
          const name = b2cUserNames[obj['interveningUserId']];
          obj['interveningUserId'] = name;
          this.renameKey(obj, 'interveningUserId', 'interveningUserName')
        }
      }
    });

    return response;
  }

  async create(
    requestUser: RequestUser,
    innovation: Innovation,
    activity: Activity,
    transaction: EntityManager,
    customParams?: { [key: string]: string }
  ) {
    if (!requestUser || !innovation || !activity) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const activityType = this.getActivityType(activity);

    const params = this.getActivityParameters(
      activity,
      requestUser,
      innovation,
      customParams
    );

    const activityLogObj = ActivityLog.new({
      innovation: { id: innovation.id },
      activity: activity,
      type: activityType,
      param: params,
      createdBy: requestUser.id,
      updatedBy: requestUser.id,
    });

    if (transaction) {
      const result = await transaction.save(ActivityLog, activityLogObj);
      return result;
    }

    return await this.activityLogRepo.save(activityLogObj);
  }

  private getActivityParameters(
    activity: Activity,
    requestUser: RequestUser,
    innovation?: Innovation,
    params?
  ) {
    let activityParams: object;

    switch (activity) {
      case Activity.INNOVATION_CREATION:
        activityParams = {
          innovationName: innovation.name,
        };
        break;
      case Activity.OWNERSHIP_TRANSFER:
      case Activity.ACTION_STATUS_DECLINED_UPDATE:
        activityParams = {
          actionUserId: params?.actionUserId || requestUser.id,
          interveningUserId: params?.interveningUserId, //Check innovation transfer & Decline action implemention to retrieve value
        };
        break;

      case Activity.SECTION_DRAFT_UPDATE:
      case Activity.SECTION_SUBMISSION:
        activityParams = {
          sectionName: params.sectionName,
        };
        break;

      case Activity.NEEDS_ASSESSMENT_START:
      case Activity.NEEDS_ASSESSMENT_COMPLETED:
      case Activity.ORGANISATION_SUGGESTION:
      case Activity.COMMENT_CREATION:
      case Activity.ACTION_STATUS_COMPLETED_UPDATE:
        activityParams = {
          actionUserId: requestUser.id,
        };
        break;

      case Activity.SUPPORT_STATUS_UPDATE:
        activityParams = {
          actionUserId: requestUser.id,
          organisationUnit: params.organisationUnit,
        };
        break;

      case Activity.ACTION_CREATION:
        activityParams = {
          actionUserId: requestUser.id,
          sectionName: params.sectionName,
        };
        break;

      case Activity.ACTION_STATUS_IN_REVIEW_UPDATE:
        activityParams = {
          totalActions: params.totalActions,
          sectionName: params.sectionName,
        };
        break;

      default:
        activityParams = null;
        break;
    }

    return JSON.stringify(activityParams);
  }

  private getActivityType(activity: Activity): ActivityType {
    let activityType: ActivityType;

    switch (activity) {
      case Activity.INNOVATION_CREATION:
      case Activity.OWNERSHIP_TRANSFER:
      case Activity.SHARING_PREFERENCES_UPDATE:
        activityType = ActivityType.INNOVATION_MANAGEMENT;
        break;

      case Activity.SECTION_DRAFT_UPDATE:
      case Activity.SECTION_SUBMISSION:
        activityType = ActivityType.INNOVATION_RECORD;
        break;

      case Activity.INNOVATION_SUBMISSION:
      case Activity.NEEDS_ASSESSMENT_START:
      case Activity.NEEDS_ASSESSMENT_COMPLETED:
        activityType = ActivityType.NEEDS_ASSESSMENT;
        break;

      case Activity.ORGANISATION_SUGGESTION:
      case Activity.SUPPORT_STATUS_UPDATE:
        activityType = ActivityType.SUPPORT;
        break;

      case Activity.COMMENT_CREATION:
        activityType = ActivityType.COMMENTS;
        break;

      case Activity.ACTION_CREATION:
      case Activity.ACTION_STATUS_IN_REVIEW_UPDATE:
      case Activity.ACTION_STATUS_DECLINED_UPDATE:
      case Activity.ACTION_STATUS_COMPLETED_UPDATE:
        activityType = ActivityType.ACTIONS;
        break;

      default:
        activityType = null;
        break;
    }

    return activityType;
  }

  private async findMany(innovationId: string, take: number, skip: number, activityTypes?: string, order?: { [key: string]: string }) {
    const query = await this.activityLogRepo
      .createQueryBuilder("activityLog")
      .where("innovation_id = :innovationId", {
        innovationId: innovationId,
      });



    if (activityTypes && activityTypes.length > 0) {
      var types = activityTypes.split(',');
      query.andWhere("activityLog.type in (:...types)", {
        types,
      });
    }

    query.take(take);
    query.skip(skip);

    if (order) {
      for (const key of Object.keys(order)) {
        query.orderBy(key, order[key] as "ASC" | "DESC");
      }
    } else {
      query.orderBy("activityLog.createdAt", "ASC");
    }

    return query.getMany();
  }

  private renameKey(obj, oldKey, newKey) {
    obj[newKey] = obj[oldKey];
    delete obj[oldKey];
  }
}