import { User, UserType } from "@domain/index";
import { Connection, getConnection } from "typeorm";
import { BaseService } from "./Base.service";

export class AccessorService extends BaseService<User> {
  private readonly connection: Connection;

  constructor(connectionName?: string) {
    super(User, connectionName);
    this.connection = getConnection(connectionName);
  }

  async create(user: User): Promise<User> {
    user.type = user.type || UserType.ACCESSOR;
    return super.create(user);
  }
}
