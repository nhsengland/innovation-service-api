/*eslint @typescript-eslint/no-unused-vars: ["off", { "varsIgnorePattern": "[qQ]ueryRunner" }]*/

import {
  Connection,
  EntitySchema,
  getConnection,
  MigrationInterface,
  ObjectType,
  QueryRunner,
  Repository,
} from "typeorm";

import * as C from "../constants";

export abstract class BaseSeed implements MigrationInterface {
  public abstract name: string;

  public abstract up(queryRunner: QueryRunner): Promise<any>;

  public abstract down(queryRunner: QueryRunner): Promise<any>;

  protected getConnection(): Connection {
    return getConnection(C.TYPEORM_SEEDING_CONNECTION_NAME);
  }

  protected getRepository<T>(
    target: ObjectType<T> | EntitySchema<T> | string
  ): Repository<T> {
    return this.getConnection().getRepository(target);
  }
}
