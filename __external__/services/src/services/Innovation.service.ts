import {
  AccessorOrganisationRole,
  Innovation,
  InnovationStatus,
  OrganisationUser,
} from "@domain/index";
import { getConnection, Connection, FindOneOptions } from "typeorm";
import {
  AssessmentInnovationSummary,
  InnovationOverviewResult,
} from "../models/InnovationOverviewResult";
import { BaseService } from "./Base.service";
import { UserService } from "./User.service";

export class InnovationService extends BaseService<Innovation> {
  private readonly connection: Connection;
  private readonly userService: UserService;

  constructor(connectionName?: string) {
    super(Innovation, connectionName);
    this.connection = getConnection(connectionName);
    this.userService = new UserService(connectionName);
  }

  async findAllByAccessor(
    userId: string,
    userOrganisations: OrganisationUser[],
    filter?: any
  ): Promise<[Innovation[], number]> {
    if (!userId) {
      throw new Error("Invalid userId. You must define the accessor id.");
    }

    if (!userOrganisations || userOrganisations.length == 0) {
      throw new Error("Invalid user. User has no organisations.");
    }

    // BUSINESS RULE: An accessor has only one organization
    const userOrganisation = userOrganisations[0];

    if (!this.hasAccessorRole(userOrganisation.role)) {
      throw new Error("Invalid user. User has an invalid role.");
    }

    const filterOptions = {
      ...filter,
    };

    if (
      userOrganisation.role === AccessorOrganisationRole.QUALIFYING_ACCESSOR
    ) {
      filterOptions.where = `organisation_id = '${userOrganisation.organisation.id}'`;
      filterOptions.relations = ["organisationShares"];
    }

    return await this.repository.findAndCount(filterOptions);
  }

  async findAllByInnovator(
    userId: string,
    filter?: any
  ): Promise<Innovation[]> {
    if (!userId) {
      throw new Error("Invalid userId. You must define the owner.");
    }

    const filterOptions = {
      ...filter,
      owner: userId,
    };

    return await this.repository.find(filterOptions);
  }

  async getInnovationOverview(
    id: string,
    userId: string
  ): Promise<InnovationOverviewResult> {
    if (!id || !userId) {
      throw new Error(
        "Invalid parameters. You must define the id and the userId."
      );
    }

    const filterOptions: FindOneOptions = {
      where: { owner: userId },
      loadRelationIds: true,
    };

    const innovation = await super.find(id, filterOptions);
    const comments = await innovation.comments;

    const result: InnovationOverviewResult = {
      id: innovation.id,
      name: innovation.name,
      description: innovation.description,
      countryName: innovation.countryName,
      postcode: innovation.postcode,
      ownerId: innovation.owner,
      status: innovation.status,
      commentsCount: comments.length,
      actionsCount: 0,
    };

    return result;
  }

  async getAssessmentInnovationSummary(
    id: string
  ): Promise<AssessmentInnovationSummary> {
    const innovationFilterOptions: FindOneOptions = {
      where: { status: InnovationStatus.WAITING_NEEDS_ASSESSMENT },
      relations: ["owner", "categories"],
    };

    const innovation = await super.find(id, innovationFilterOptions);
    const b2cUser = await this.userService.getProfile(innovation.owner.id);

    // Business Rule. One user only belongs to 1 organisation.
    const company =
      b2cUser.organisations.length > 0 ? b2cUser.organisations[0].name : "-";
    const categories = await innovation.categories;

    return {
      summary: {
        id: innovation.id,
        company,
        location: `${innovation.countryName}, ${innovation.postcode}`,
        description: innovation.description,
        categories: categories?.map((category) => category.type),
      },
      contact: {
        name: b2cUser.displayName,
        email: b2cUser.email,
        phone: b2cUser.phone,
      },
    };
  }

  private hasAccessorRole(roleStr: string) {
    const role = AccessorOrganisationRole[roleStr];
    return (
      [
        AccessorOrganisationRole.QUALIFYING_ACCESSOR,
        AccessorOrganisationRole.ACCESSOR,
      ].indexOf(role) !== -1
    );
  }
}
