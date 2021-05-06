import { Comment } from "@domain/index";
import { getConnection, Connection } from "typeorm";
import { BaseService } from "./Base.service";

export class CommentService extends BaseService<Comment> {
  private readonly connection: Connection;

  constructor(connectionName?: string) {
    super(Comment, connectionName);
    this.connection = getConnection(connectionName);
  }

  async create(comment: Comment): Promise<Comment> {
    return super.create(comment);
  }
}
