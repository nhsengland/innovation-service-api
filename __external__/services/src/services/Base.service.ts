import {
  EntityTarget,
  FindOneOptions,
  getRepository,
  Repository,
} from "typeorm";

export abstract class BaseService<T> {
  readonly repository: Repository<T>;

  constructor(repo: EntityTarget<T>, connectionName?: string) {
    this.repository = getRepository<T>(repo, connectionName);
  }

  async find(id: string, options?: FindOneOptions) {
    if (!id) return;
    return await this.repository.findOne(id, options);
  }

  async create(item: T) {
    try {
      return await this.repository.save(item);
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, item: T) {
    const entity = await this.find(id);
    if (!entity) throw new Error("Entity not found");

    return await this.repository.save(item);
  }

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  async findAll(filter?: any): Promise<T[]> {
    throw new Error("Not implemented.");
  }
}
