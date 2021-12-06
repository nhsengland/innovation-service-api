import { Activity, ActivityType } from "@domain/enums/activity.enums";
import { ActivityLog, Innovation } from "@domain/index";
import { InvalidParamsError } from "@services/errors";
import { ActivityLogModel } from "@services/models/ActivityLogModel";
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
import { UserService } from "./User.service";

export class ActivityLogService extends BaseService<ActivityLog> {
  private readonly connection: Connection;
  private readonly activityLogRepo: Repository<ActivityLog>;
  private readonly loggerService: LoggerService;
  private readonly userService: UserService;

  constructor(connectionName?: string) {
    super(ActivityLog, connectionName);
    this.connection = getConnection(connectionName);
    this.activityLogRepo = getRepository(ActivityLog, connectionName);
    this.loggerService = new LoggerService();
    this.userService = new UserService(connectionName);
  }

  async getInnovationActivitiesById(
    requestUser: RequestUser,
    innovation: Innovation,
    take: number,
    skip: number,
    activityTypes: string,
    order?: { [key: string]: string }
  ) {
    if (!requestUser || !innovation) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const activityLogs = await this.findMany(
      innovation.id,
      take,
      skip,
      activityTypes,
      order
    );

    // If no records = quick return
    if (activityLogs[1] === 0) {
      return {
        data: [],
        count: 0,
      };
    }

    const b2cUserNames = await this.getNamesForParamUserIds(activityLogs[0]);

    const response: ActivityLogModel[] = activityLogs[0].map((log) => {
      const rec: ActivityLogModel = {
        date: log.createdAt,
        type: log.type,
        activity: log.activity,
        innovation: { id: innovation.id, name: innovation.name },
        params: JSON.parse(log.param),
      };

      return rec;
    });

    response.forEach((log) => {
      const obj = log.params;
      if (obj) {
        if (obj["actionUserId"]) {
          const name = b2cUserNames[obj["actionUserId"]];
          obj["actionUserId"] = name;
          this.renameKey(obj, "actionUserId", "actionUserName");
        }
        if (obj["interveningUserId"]) {
          const name = b2cUserNames[obj["interveningUserId"]];
          obj["interveningUserId"] = name;
          this.renameKey(obj, "interveningUserId", "interveningUserName");
        }
      }
    });

    const result = {
      data: response,
      count: activityLogs[1],
    };

    return result;
  }

  async createLog(
    requestUser: RequestUser,
    innovation: Innovation,
    activity: Activity,
    transaction: EntityManager,
    customParams?: { [key: string]: any }
  ) {
    if (!requestUser || !innovation || !activity) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const activityType = this.getActivityType(activity);

    const params = this.getActivityParameters(requestUser, customParams);

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

  private getActivityParameters(requestUser: RequestUser, params?) {
    const activityParams = {
      actionUserId: params?.actionUserId || requestUser.id,
      interveningUserId: params?.interveningUserId, //Check innovation transfer & Decline action implemention to retrieve value
      assessmentId: params?.assessmentId,
      innovationSupportStatus: params?.innovationSupportStatus,
      sectionId: params?.sectionId,
      actionId: params?.actionId,
      organisations: params?.organisations,
      organisationUnit: params?.organisationUnit,
      comment: {
        id: params?.commentId,
        value: params?.commentValue,
      },
      totalActions: params?.totalActions,
    };

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

  private async findMany(
    innovationId: string,
    take: number,
    skip: number,
    activityTypes?: string,
    order?: { [key: string]: string }
  ) {
    const filterOptions = {
      where: {},
      skip,
      take,
      order: order || { createdAt: "ASC" },
    };

    filterOptions.where = `innovation_id = '${innovationId}'`;

    if (activityTypes && activityTypes.length > 0) {
      const types = activityTypes.split(",");
      const userIds = types.map((t) => `'${t}'`).join(",");
      filterOptions.where += ` and activityLog.type in (${userIds})`;
    }

    const logs = await this.repository.findAndCount(filterOptions);

    return logs;
  }

  private async getNamesForParamUserIds(activityLogs) {
    const userIds = [];
    activityLogs.forEach((res: ActivityLog) => {
      const obj = JSON.parse(res.param);
      if (obj) {
        if (
          obj.hasOwnProperty("actionUserId") &&
          userIds.indexOf(obj["actionUserId"]) === -1
        ) {
          userIds.push(obj["actionUserId"]);
        }
        if (
          obj.hasOwnProperty("interveningUserId") &&
          userIds.indexOf(obj["interveningUserId"]) === -1
        ) {
          userIds.push(obj["interveningUserId"]);
        }
      }
    });

    const b2cUsers = await this.userService.getListOfUsers(userIds);
    const b2cUserNames = b2cUsers.reduce((map, obj) => {
      map[obj.id] = obj.displayName;
      return map;
    }, {});

    return b2cUserNames;
  }

  private renameKey(obj, oldKey, newKey) {
    obj[newKey] = obj[oldKey];
    delete obj[oldKey];
  }
}
