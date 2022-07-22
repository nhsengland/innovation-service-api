import { Activity } from "@domain/enums/activity.enums";
import { NotificationActionType } from "@domain/enums/notification.enums";
import { Comment, NotificationContextType, UserType } from "@domain/index";
import {
  InnovationNotFoundError,
  InvalidDataError,
  InvalidParamsError,
  MissingUserOrganisationError,
  MissingUserOrganisationUnitError,
  ResourceNotFoundError,
} from "@services/errors";
import { checkIfValidUUID } from "@services/helpers";
import { CommentModel } from "@services/models/CommentModel";
import { RequestUser } from "@services/models/RequestUser";
import { Connection, getConnection, getRepository, Repository } from "typeorm";
import { QueueProducer } from "utils/queue-producer";
import { ActivityLogService } from "./ActivityLog.service";
import { InnovationService } from "./Innovation.service";
import { LoggerService } from "./Logger.service";
import { NotificationService } from "./Notification.service";
import { UserService } from "./User.service";

export class CommentService {
  private readonly connection: Connection;
  private readonly commentRepo: Repository<Comment>;
  private readonly innovationService: InnovationService;
  private readonly userService: UserService;
  private readonly notificationService: NotificationService;
  private readonly logService: LoggerService;
  private readonly activityLogService: ActivityLogService;
  private readonly queueProducer: QueueProducer;

  constructor(connectionName?: string) {
    this.connection = getConnection(connectionName);
    this.commentRepo = getRepository(Comment, connectionName);
    this.innovationService = new InnovationService(connectionName);
    this.userService = new UserService(connectionName);
    this.notificationService = new NotificationService(connectionName);
    this.activityLogService = new ActivityLogService(connectionName);
    this.logService = new LoggerService();
    this.queueProducer = new QueueProducer();
  }

  async create(
    requestUser: RequestUser,
    innovationId: string,
    message: string,
    isEditable?: boolean,
    replyTo?: string,
    innovationActionId?: string
  ): Promise<Comment> {
    if (!requestUser || !innovationId || !message || message.length === 0) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    let organisationUnit = null;
    if (requestUser.type === UserType.ACCESSOR) {
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

      organisationUnit = {
        id: requestUser.organisationUnitUser.organisationUnit.id,
      };
    }

    const commentObj = {
      message,
      user: { id: requestUser.id },
      innovation: { id: innovationId },
      innovationAction: innovationActionId ? { id: innovationActionId } : null,
      replyTo: replyTo ? { id: replyTo } : null,
      createdBy: requestUser.id,
      updatedBy: requestUser.id,
      organisationUnit,
      isEditable,
    };

    const result = await this.connection.transaction(async (trs) => {
      const innovation = await this.innovationService.find(innovationId);
      if (!innovation) {
        throw new InnovationNotFoundError(
          `The Innovation with id ${innovationId} was not found.`
        );
      }
      const comment = await trs.save(Comment, commentObj);
      if (comment.replyTo === null) {
        try {
          await this.activityLogService.createLog(
            requestUser,
            innovation,
            Activity.COMMENT_CREATION,
            trs,
            {
              commentId: comment.id,
              commentValue: comment.message,
            }
          );
        } catch (error) {
          this.logService.error(
            `An error has occured while creating activity log from ${requestUser.id}`,
            error
          );
          throw error;
        }
      }

      return comment;
    });

    const action =
      requestUser.type === UserType.INNOVATOR
        ? NotificationActionType.ACCESSOR_COMMENT_RECEIVED
        : NotificationActionType.INNOVATOR_COMMENT_RECEIVED;

    try {
      // send in-app: to assigned accessors (if reply, to the users inside thread)
      // if innovator send to accessors, if accessor send to innovator
      // send email: (same rules)
      await this.queueProducer.sendNotification(
        action,
        {
          id: requestUser.id,
          identityId: requestUser.externalId,
          type: requestUser.type,
        },
        {
          innovationId,
          commentId: result.id,
          replyToId: replyTo,
        }
      );
    } catch (error) {
      this.logService.error(
        `An error has occured while writing notification on queue of type ${action}`,
        error
      );
    }

    return result;
  }

  async update(
    requestUser: RequestUser,
    innovationId: string,
    message: string,
    id: string
  ) {
    if (
      !requestUser ||
      !innovationId ||
      !message ||
      message.length === 0 ||
      !id
    ) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const innovation = await this.innovationService.find(innovationId);
    if (!innovation) {
      throw new InnovationNotFoundError(
        `The Innovation with id ${innovationId} was not found.`
      );
    }

    const result = await this.connection.transaction(async (trs) => {
      const filterOptions = {
        where: { innovation: innovationId },
        relations: ["innovation"],
      };
      const comment = await this.commentRepo.findOne(id, filterOptions);

      if (comment) {
        if (
          comment.isEditable === true &&
          comment.createdBy === requestUser.id
        ) {
          await trs.update(
            Comment,
            { id: id },
            {
              message: message,
              updatedBy: requestUser.id,
            }
          );
          return { id: comment.id };
        } else {
          throw new InvalidDataError(
            "Invalid Data. Cannot updated this comment"
          );
        }
      } else {
        throw new ResourceNotFoundError("Comment not found");
      }
    });
    return result;
  }

  async findAllByInnovation(
    requestUser: RequestUser,
    innovationId: string,
    order?: { [key: string]: string }
  ) {
    if (!requestUser || !innovationId || !checkIfValidUUID(innovationId)) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const innovation = await this.innovationService.findInnovation(
      requestUser,
      innovationId,
      null
    );
    if (!innovation) {
      throw new InnovationNotFoundError(
        "Invalid parameters. Innovation not found for the user."
      );
    }

    const notifications = await this.notificationService.getUnreadNotifications(
      requestUser,
      innovationId,
      NotificationContextType.COMMENT
    );

    const filterOptions = {
      relations: ["user", "organisationUnit", "replyTo"],
      where: { innovation: innovationId },
      order: order || { createdAt: "DESC" },
    };
    const comments = await this.commentRepo.find(filterOptions);

    const userIds = comments.map((comment: Comment) => comment.user.externalId);

    const b2cUsers = await this.userService.getListOfUsers(userIds);
    const b2cUserNames = b2cUsers.reduce((map, obj) => {
      map[obj.id] = obj.displayName;
      return map;
    }, {});

    const result = comments
      .filter((comment: Comment) => comment.replyTo === null)
      .map((comment: Comment) =>
        this.getFormattedComment(comment, b2cUserNames, notifications)
      );

    result.map((res) => {
      res.replies = comments
        .filter(
          (comment: Comment) => comment.replyTo && comment.replyTo.id === res.id
        )
        .map((comment: Comment) =>
          this.getFormattedComment(comment, b2cUserNames, notifications)
        );
    });

    return result;
  }

  private getFormattedComment(
    comment: Comment,
    b2cUserNames: { [key: string]: string },
    notifications?: {
      id: string;
      contextType: string;
      contextId: string;
      innovationId: string;
      readAt: string;
    }[]
  ): CommentModel {
    const unread = notifications?.filter((n) => n.contextId === comment.id);

    const commentModel: CommentModel = {
      id: comment.id,
      message: comment.message,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      isEditable: comment.isEditable,
      user: {
        id: comment.user.id,
        externalId: comment.user.externalId,
        type: comment.user.type,
        name: b2cUserNames[comment.user.externalId],
      },
      notifications: {
        count: unread?.length || 0,
        data: unread,
      },
    };

    if (comment.organisationUnit) {
      commentModel.user.organisationUnit = {
        id: comment.organisationUnit.id,
        name: comment.organisationUnit.name,
      };
    }

    return commentModel;
  }
}
