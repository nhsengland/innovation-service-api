import {
  NotifContextDetail,
  NotifContextPayloadType,
  NotifContextType,
  NotificationParamsType,
} from "@domain/enums/notification.enums";
import {
  InnovationStatus,
  Notification,
  NotificationUser,
} from "@domain/index";
import { InvalidParamsError } from "@services/errors";
import { checkIfValidUUID } from "@services/helpers";
import { RequestUser } from "@services/models/RequestUser";
import { Connection, getConnection, getRepository, Repository } from "typeorm";
import { PaginationQueryParamsType } from "../../../../utils/joi.helper";
import { NotificationDismissResult } from "./Notification.service";
import { UserService } from "./User.service";

export class InAppNotificationService {
  private readonly notificationRepo: Repository<Notification>;
  private readonly connection: Connection;
  private readonly userService: UserService;
  private readonly notificationUserRepo: Repository<NotificationUser>;

  constructor(connectionName?: string) {
    this.connection = getConnection(connectionName);
    this.notificationRepo = getRepository(Notification, connectionName);
    this.userService = new UserService(connectionName);
    this.notificationUserRepo = getRepository(NotificationUser, connectionName);
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
        const params = notification.params
          ? (JSON.parse(notification.params) as NotificationParamsType)
          : {};

        const userInfo = createdByUsers.find(
          (createdByUser) => (createdByUser.id = notification.createdBy)
        );

        return {
          id: notification.id,
          innovation: {
            id: notification.innovation.id,
            status: notification.innovation.status,
            name: notification.innovation.name,
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

  async getNotificationCountersByUserId(
    requestUser: RequestUser
  ): Promise<{ total: number }> {
    if (!requestUser) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const query = this.notificationRepo
      .createQueryBuilder("notification")
      .innerJoinAndSelect("notification.notificationUsers", "notificationUsers")
      .where("notificationUsers.user_id = :userId", {
        userId: requestUser.id,
      })
      .andWhere("notificationUsers.read_at IS NULL");

    const dbActivities = await query.getManyAndCount();

    return {
      total: dbActivities[1],
    };
  }

  async dismiss(
    requestUser: RequestUser,
    dismissAll: boolean,
    notificationIds?: string[],
    context?: NotifContextPayloadType
  ): Promise<NotificationDismissResult> {
    if (!requestUser || (!dismissAll && !notificationIds && !context)) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    if (context) {
      if (!checkIfValidUUID(context.id)) {
        throw new InvalidParamsError("Invalid parameters.");
      }
    }

    const query = this.notificationRepo
      .createQueryBuilder("notification")
      .innerJoinAndSelect("notification.notificationUsers", "notificationUsers")
      .where("notificationUsers.user_id = :userId", {
        userId: requestUser.id,
      })
      .andWhere("notificationUsers.read_at IS NULL");

    // Search by notificationIds
    if (!dismissAll && notificationIds && notificationIds.length > 0) {
      query.andWhere(
        "notificationUsers.notification_id in (:...notificationIds)",
        {
          notificationIds,
        }
      );
    }

    // Search by context
    if (!dismissAll && context) {
      query
        .andWhere("notification.context_type = :contextType", {
          contextType: context.type,
        })
        .andWhere("notification.context_id = :contextId", {
          contextId: context.id,
        });
    }

    const notifications = await query.getMany();

    if (notifications.length === 0) {
      return {
        affected: 0,
        error: "No notifications found",
      };
    }

    try {
      const notificationIdsFromQuery = notifications.map((u) => u.id);

      if (notificationIdsFromQuery.length > 0) {
        await this.notificationUserRepo
          .createQueryBuilder()
          .update(NotificationUser)
          .set({ readAt: () => "CURRENT_TIMESTAMP" })
          .where(
            "user = :userId and notification in (:...notificationId) and read_at IS NULL",
            { userId: requestUser.id, notificationId: notificationIdsFromQuery }
          )
          .execute();
      }
    } catch (error) {
      return {
        error,
        affected: 0,
      };
    }

    return {
      affected: notifications.length,
    };
  }

  async deleteNotification(requestUser: RequestUser, notificationId: string) {
    if (!notificationId || !requestUser) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    return await this.connection.transaction(async (transactionManager) => {
      try {
        await transactionManager.update(
          NotificationUser,
          { notification: notificationId, user: requestUser.id },
          {
            deletedAt: new Date(),
          }
        );

        return {
          id: notificationId,
          status: "DELETED",
        };
      } catch (error) {
        throw new Error(error);
      }
    });
  }

  async getNotificationsByInnovationId(
    requestUser: RequestUser,
    innovationId: string
  ): Promise<{
    count: number;
    data: { [key: string]: number };
  }> {
    if (!requestUser || !innovationId) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const query = this.notificationRepo
      .createQueryBuilder("notification")
      .innerJoinAndSelect("notification.notificationUsers", "notificationUsers")
      .innerJoinAndSelect("notification.innovation", "innovation")
      .where("notificationUsers.user_id = :userId", {
        userId: requestUser.id,
      })
      .andWhere("innovation.id = :innovationId", {
        innovationId: innovationId,
      })
      .andWhere("notificationUsers.read_at IS NULL");

    const dbActivities = await query.getManyAndCount();

    // Get counters by contextType
    const data = dbActivities[0].reduce((acumulator, notification) => {
      const name = notification.contextType;
      if (!acumulator.hasOwnProperty(name)) {
        acumulator[name] = 0;
      }
      acumulator[name]++;
      return acumulator;
    }, {});

    return {
      count: dbActivities[1],
      data,
    };
  }
}
