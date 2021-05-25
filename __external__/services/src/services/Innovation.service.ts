import {
  AccessorOrganisationRole,
  Innovation,
  InnovationStatus,
  OrganisationUser,
} from "@domain/index";
import { InnovationListModel } from "@services/models/InnovationListModel";
import { ProfileSlimModel } from "@services/models/ProfileSlimModel";
import {
  getConnection,
  Connection,
  FindOneOptions,
  FindManyOptions,
  In,
  IsNull,
} from "typeorm";
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

  async getInnovationListByState(
    statuses: string[]
  ): Promise<InnovationListModel> {
    const filter: FindManyOptions<Innovation> = {
      where: { status: In(statuses), deletedAt: IsNull() },
      relations: ["assessments", "assessments.assignTo"],
    };

    const result = await this.repository.findAndCount(filter);

    const deepUsers = result[0]
      .filter(
        (innovation) =>
          innovation.assessments && innovation.assessments.length > 0
      )
      .map((innovation) => {
        return innovation.assessments.map((a) => a.assignTo.id);
      });

    let res = [];
    if (deepUsers.length > 0) {
      res = await this.mapB2CUsers(deepUsers, result[0]);
    } else {
      res = result[0];
    }

    return {
      data: res,
      count: result[1],
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

  private async mapB2CUsers(deepUsers: string[][], innovations: Innovation[]) {
    // create array of user ids to send to ms graph api. results in ['abc','fhdjhf', 'hfdjfhdj']
    const assessmentUsers = deepUsers.flatMap((d) => d.map((i) => i));

    // fetch B2C users by id from ms graph api
    const b2cUsers = await this.userService.getListOfUsers(assessmentUsers);

    // transforms response from B2C to a slim profile model
    // {'id': 'value', ...}
    const b2cMap = this.makeB2CDictionary(b2cUsers);

    // remaps the innovation object with the assessment user's displayName
    return this.applyToInnovation(innovations, b2cMap);
  }

  private makeB2CDictionary(b2cUsers: ProfileSlimModel[]) {
    // returns object { 'abc': 'John Smith', 'cba': 'Mary Jane'}
    return b2cUsers.reduce((map, obj) => {
      map[obj.id] = obj.displayName;
      return map;
    }, {});
  }

  private applyToInnovation(innovations: Innovation[], b2cMap: any) {
    return innovations.map((innovation) => {
      // expands the Innovation object and adds a assessmentUser property
      const tmp = {
        ...innovation,
        assessmentUser: {},
      };

      // maps the new value to the assessmentUser property
      innovation.assessments.forEach((a) => {
        tmp.assessmentUser = { id: a.assignTo.id, name: b2cMap[a.assignTo.id] };
      });

      return tmp;
    });
  }
}
