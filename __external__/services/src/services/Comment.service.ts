import { Comment, UserType } from "@domain/index";
import {
  InnovationNotFoundError,
  InvalidParamsError,
  MissingUserOrganisationError,
  MissingUserOrganisationUnitError,
} from "@services/errors";
import { CommentModel } from "@services/models/CommentModel";
import { RequestUser } from "@services/models/RequestUser";
import { Connection, getConnection, getRepository, Repository } from "typeorm";
import { InnovationService } from "./Innovation.service";
import { UserService } from "./User.service";

export class CommentService {
  private readonly connection: Connection;
  private readonly commentRepo: Repository<Comment>;
  private readonly innovationService: InnovationService;
  private readonly userService: UserService;

  constructor(connectionName?: string) {
    this.connection = getConnection(connectionName);
    this.commentRepo = getRepository(Comment, connectionName);
    this.innovationService = new InnovationService(connectionName);
    this.userService = new UserService(connectionName);
  }

  async create(
    requestUser: RequestUser,
    innovationId: string,
    message: string,
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
    };

    return this.commentRepo.save(commentObj);
  }

  async findAllByInnovation(
    requestUser: RequestUser,
    innovationId: string,
    order?: { [key: string]: string }
  ) {
    if (!requestUser || !innovationId) {
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

    const filterOptions = {
      relations: ["user", "organisationUnit", "replyTo"],
      where: { innovation: innovationId },
      order: order || { createdAt: "DESC" },
    };
    const comments = await this.commentRepo.find(filterOptions);

    const userIds = comments.map((comment: Comment) => comment.user.id);

    const b2cUsers = await this.userService.getListOfUsers(userIds);
    const b2cUserNames = b2cUsers.reduce((map, obj) => {
      map[obj.id] = obj.displayName;
      return map;
    }, {});

    const result = comments
      .filter((comment: Comment) => comment.replyTo === null)
      .map((comment: Comment) =>
        this.getFormattedComment(comment, b2cUserNames)
      );

    result.map((res) => {
      res.replies = comments
        .filter(
          (comment: Comment) => comment.replyTo && comment.replyTo.id === res.id
        )
        .map((comment: Comment) =>
          this.getFormattedComment(comment, b2cUserNames)
        );
    });

    return result;
  }

  private getFormattedComment(
    comment: Comment,
    b2cUserNames: { [key: string]: string }
  ): CommentModel {
    const commentModel: CommentModel = {
      id: comment.id,
      message: comment.message,
      createdAt: comment.createdAt,
      user: {
        id: comment.user.id,
        type: comment.user.type,
        name: b2cUserNames[comment.user.id],
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
