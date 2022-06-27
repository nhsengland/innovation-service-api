import {
  NotifContextDetail,
  NotifContextType,
  NotificationParamsType,
  PaginationQueryParamsType,
} from "@domain/enums/notification.enums";
import { InnovationStatus, Notification } from "@domain/index";
import { InvalidParamsError } from "@services/errors";
import { RequestUser } from "@services/models/RequestUser";
import { Connection, getConnection, getRepository, Repository } from "typeorm";
import { UserService } from "./User.service";

export class InAppNotificationService {
  private readonly notificationRepo: Repository<Notification>;
  private readonly connection: Connection;
  private readonly connectionName: string;
  private readonly userService: UserService;

  constructor(connectionName?: string) {
    this.connectionName = connectionName;
    this.connection = getConnection(connectionName);

    this.notificationRepo = getRepository(Notification, connectionName);
    this.userService = new UserService(connectionName);
  }

  async getNotificationsByUserId(
    requestUser: RequestUser,
    filters: { contextTypes?: NotifContextType; unreadOnly?: boolean },
    pagination: PaginationQueryParamsType<"createdAt">
  ): Promise<{
    count: number;
    data: {
      id: string;
      innovation: { id: string; status: InnovationStatus };
      contextType: NotifContextType;
      contextDetail: NotifContextDetail;
      contextId: string;
      createdAt: Date;
      readAt: Date;
      params: NotificationParamsType;
    }[];
  }> {
    if (!requestUser) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const query = this.notificationRepo
      .createQueryBuilder("notification")
      .innerJoinAndSelect("notification.notificationUsers", "notificationUsers")
      .innerJoinAndSelect("notification.innovation", "innovation")
      .where("notificationUsers.user_id = :userId", {
        userId: requestUser.id,
      });

    // Filters
    if (filters.contextTypes && filters.contextTypes.length > 0) {
      query.andWhere("notification.context_type IN (:...contextType)", {
        contextType: filters.contextTypes,
      });
    }

    /*if (filters.contextDetails && filters.contextDetails.length > 0){
				query.andWhere('notification.context_detail IN (:...contextDetail)', { contextDetail: filters.contextDetails })
			}*/

    if (filters.unreadOnly === true) {
      query.andWhere("notificationUsers.read_at IS NULL");
    }

    // Pagination and ordering
    query.skip(pagination.skip);
    query.take(pagination.take);

    for (const [key, order] of Object.entries(
      pagination.order || { default: "DESC" }
    )) {
      let field: string;
      switch (key) {
        case "createdAt":
          field = "notification.createdAt";
          break;
        default:
          field = "notification.createdAt";
          break;
      }
      query.addOrderBy(field, order as "ASC" | "DESC");
    }

    const dbActivities = await query.getManyAndCount();

    if (dbActivities[1] === 0) {
      return {
        count: 0,
        data: [],
      };
    }

    const uniqueCreatedByIds = [
      ...new Set(dbActivities[0].map((notification) => notification.createdBy)),
    ];
    const createdByUsers = await this.userService.getUsersList({
      userIds: uniqueCreatedByIds,
    });

    return {
      count: dbActivities[1],
      data: dbActivities[0].map((notification) => {
        const params = JSON.parse(
          notification.params
        ) as NotificationParamsType;

        //add params logic
        const userInfo = createdByUsers.find(
          (createdByUser) => (createdByUser.id = notification.createdBy)
        );

        return {
          id: notification.id,
          innovation: {
            id: notification.innovation.id,
            status: notification.innovation.status,
          },
          contextType: notification.contextType,
          contextDetail: notification.contextDetail,
          contextId: notification.contextId,
          createdAt: notification.createdAt,
          createdBy: userInfo.displayName,
          readAt: notification.notificationUsers[0]?.readAt,

          params,
        };
      }),
    };
  }
}
