import { Activity, ActivityType } from "@domain/enums/activity.enums";
import { ActivityLog, Innovation } from "@domain/index";
import { InnovationNotFoundError, InvalidParamsError } from "@services/errors";
import { RequestUser } from "@services/models/RequestUser";
import {
  Connection,
  EntityManager,
  getConnection,
  getRepository,
  Repository,
} from "typeorm";
import { InnovationService } from "./Innovation.service";
import { LoggerService } from "./Logger.service";

export class ActivityLogService {
  private readonly connection: Connection;
  private readonly activityLogRepo: Repository<ActivityLog>;
  private readonly loggerService: LoggerService;

  constructor(connectionName?: string) {
    this.connection = getConnection(connectionName);
    this.activityLogRepo = getRepository(ActivityLog, connectionName);
    this.loggerService = new LoggerService();
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
      case Activity.OWNERSHIP_TRANSFER:
      case Activity.ACTION_STATUS_DECLINED_UPDATE:
        activityParams = {
          actionUserId: requestUser.id,
          interveningUserId: "", //Check innovation transfer & Decline action implemention to retrieve value
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
}
