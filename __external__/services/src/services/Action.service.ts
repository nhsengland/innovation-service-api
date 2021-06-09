import { InnovationAction, InnovationActionStatus } from "@domain/index";
import { Connection, getConnection } from "typeorm";
import { BaseService } from "./Base.service";

export class ActionService extends BaseService<InnovationAction> {
  private readonly connection: Connection;

  constructor(connectionName?: string) {
    super(InnovationAction, connectionName);
    this.connection = getConnection(connectionName);
  }

  async create(action: InnovationAction): Promise<InnovationAction> {
    action.status = InnovationActionStatus.REQUESTED;
    return super.create(action);
  }
}
