import {
  AccessorOrganisationRole,
  Innovation,
  InnovationStatus,
  InnovationSupportStatus,
  OrganisationUser,
} from "@domain/index";
import {
  InnovationListModel,
  InnovationViewModel,
} from "@services/models/InnovationListModel";
import { ProfileSlimModel } from "@services/models/ProfileSlimModel";
import {
  Connection,
  FindManyOptions,
  FindOneOptions,
  getConnection,
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
        status: innovation.status,
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
    statuses: string[],
    skip: number,
    take: number
  ): Promise<InnovationListModel> {
    const filter: FindManyOptions<Innovation> = {
      where: { status: In(statuses), deletedAt: IsNull() },
      relations: [
        "assessments",
        "assessments.assignTo",
        "innovationSupports",
        "innovationSupports.organisationUnit",
        "innovationSupports.organisationUnit.organisation",
      ],
      skip,
      take,
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
      res = res.map((i: Innovation) => ({
        ...i,
        assessments: i.assessments,
        innovationSupports: i.innovationSupports,
        organisations: this.extractEngagingOrganisationAcronyms(i),
      }));
    } else {
      res = result[0].map((i) => ({
        ...i,
        assessments: i.assessments,
        innovationSupports: i.innovationSupports,
        organisations: this.extractEngagingOrganisationAcronyms(i),
      }));
    }

    return {
      data: this.mapResponse(res),
      count: result[1],
    };
  }

  async submitInnovation(id: string, userId: string) {
    if (!id || !userId) {
      throw new Error(
        "Invalid parameters. You must define the id and the userId."
      );
    }

    const filterOptions: FindOneOptions = {
      where: { owner: userId, status: InnovationStatus.CREATED },
      loadRelationIds: true,
    };

    const innovation = await super.find(id, filterOptions);
    if (!innovation) {
      return null;
    }

    await this.repository.update(innovation.id, {
      status: InnovationStatus.WAITING_NEEDS_ASSESSMENT,
      updatedBy: userId,
    });

    return {
      id: innovation.id,
      status: InnovationStatus.WAITING_NEEDS_ASSESSMENT,
    };
  }

  private extractEngagingOrganisationAcronyms(innovation: Innovation) {
    // only organisation with innovationSupportStatus ENGAGING
    const supports = innovation.innovationSupports;
    return supports
      ?.filter(
        (innovationSupport) =>
          innovationSupport.status === InnovationSupportStatus.ENGAGING
      )
      .map((s) => s.organisationUnit.organisation.acronym);
  }

  hasAccessorRole(roleStr: string) {
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
        assessments: {
          ...innovation.assessments,
          user: null,
        },
      };

      // maps the new value to the assessmentUser property
      innovation.assessments.forEach((a) => {
        tmp.assessments.user = {
          id: a.assignTo.id,
          name: b2cMap[a.assignTo.id],
        };
      });

      return tmp;
    });
  }

  private mapResponse(res: any[]): InnovationViewModel[] {
    const result: InnovationViewModel[] = res.map((r) => ({
      id: r.id,
      name: r.name,
      submittedAt: r.submittedAt,
      countryName: r.countryName,
      postCode: r.postCode,
      mainCategory: r.mainCategory,
      assessment: {
        createdAt: r.assessments[0]?.createdAt,
        assignTo: { name: r.assessments?.user?.name },
        finishedAt: r.assessments[0]?.finishedAt,
      },
      organisations: r.organisations || [],
    }));

    return result;
  }
}
