import {
  Organisation,
  OrganisationUnit,
  OrganisationUser,
  User,
} from "@domain/index";
import { getConnection, Connection, getRepository, Repository } from "typeorm";
import { BaseService } from "./Base.service";

export class OrganisationService extends BaseService<Organisation> {
  private readonly connection: Connection;
  private readonly organisationUnitRepo: Repository<OrganisationUnit>;

  constructor(connectionName?: string) {
    super(Organisation, connectionName);
    this.connection = getConnection(connectionName);
    this.orgUserRepo = getRepository(OrganisationUser, connectionName);
    this.organisationUnitRepo = getRepository(OrganisationUnit, connectionName);
  }

  async create(organisation: Organisation): Promise<Organisation> {
    return super.create(organisation);
  }

  async findAll(filter: any): Promise<Organisation[]> {
    if (!filter.type) {
      throw new Error("Invalid filter. You must define the organisation type.");
    }

    const filterOptions = {
      ...filter,
    };

    return await this.repository.find(filterOptions);
  }

  private readonly orgUserRepo: Repository<OrganisationUser>;

  async findUserOrganisations(userId: string): Promise<OrganisationUser[]> {
    return await this.orgUserRepo.find({
      where: {
        user: userId,
      },
      relations: ["user", "organisation"],
    });
  }

  async addUserToOrganisation(
    user: User,
    organisation: Organisation,
    role: string
  ): Promise<OrganisationUser> {
    const orgUserObj = OrganisationUser.new({
      organisation,
      user,
      role,
    });

    try {
      return await this.orgUserRepo.save(orgUserObj);
    } catch (error) {
      throw error;
    }
  }

  async addOrganisationUnit(unit: OrganisationUnit): Promise<OrganisationUnit> {
    return await this.organisationUnitRepo.save(unit);
  }
}
