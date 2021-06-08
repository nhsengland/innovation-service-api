import {
  AccessorOrganisationRole,
  Innovation,
  InnovationStatus,
  InnovationSupport,
  InnovationSupportStatus,
  InnovatorOrganisationRole,
  OrganisationUser,
} from "@domain/index";
import { hasAccessorRole } from "@services/helpers";
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
  getRepository,
  In,
  IsNull,
  Repository,
} from "typeorm";
import {
  AssessmentInnovationSummary,
  InnovationOverviewResult,
} from "../models/InnovationOverviewResult";
import { BaseService } from "./Base.service";
import { UserService } from "./User.service";

export class InnovationService extends BaseService<Innovation> {
  private readonly userService: UserService;
  private readonly supportRepo: Repository<InnovationSupport>;

  constructor(connectionName?: string) {
    super(Innovation, connectionName);
    getConnection(connectionName);

    this.userService = new UserService(connectionName);
    this.supportRepo = getRepository(InnovationSupport, connectionName);
  }

  async findInnovation(
    innovationId: string,
    userId: string,
    filter?: any,
    userOrganisations?: OrganisationUser[]
  ) {
    if (!userId || !innovationId) {
      throw new Error(
        "Invalid params. You must define the user id and the innovation id."
      );
    }

    // BUSINESS RULE: An user has only one organization
    let role;
    let userOrganisation;
    const filterRelations = filter && filter.relations ? filter.relations : [];

    if (userOrganisations && userOrganisations.length > 0) {
      userOrganisation = userOrganisations[0];
      role = userOrganisation.role;
    } else {
      role = InnovatorOrganisationRole.INNOVATOR_OWNER;
    }

    let filterOptions;
    switch (role) {
      case InnovatorOrganisationRole.INNOVATOR_OWNER:
        filterOptions = filter
          ? filter
          : {
              where: { owner: userId },
              loadRelationIds: true,
            };
        break;
      case AccessorOrganisationRole.ACCESSOR:
        // BUSINESS RULE: An user has only one organization unit
        const organisationUnit = userOrganisation.userOrganisationUnits[0];

        filterOptions = {
          relations: ["innovationSupports", ...filterRelations],
          where: `organisation_unit_id = '${organisationUnit.id}'`,
        };
        break;
      case AccessorOrganisationRole.QUALIFYING_ACCESSOR:
        filterOptions = {
          relations: ["organisationShares", "assessments", ...filterRelations],
          where: `organisation_id = '${userOrganisation.organisation.id}'`,
        };
        break;
      default:
        throw new Error("Invalid user role.");
    }

    return super.find(innovationId, filterOptions);
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

    if (!hasAccessorRole(userOrganisation.role)) {
      throw new Error("Invalid user. User has an invalid role.");
    }

    const filterOptions = {
      ...filter,
    };

    if (
      userOrganisation.role === AccessorOrganisationRole.QUALIFYING_ACCESSOR
    ) {
      filterOptions.where = `organisation_id = '${userOrganisation.organisation.id}'`;
      filterOptions.relations = ["organisationShares", "assessments"];
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
    userId: string,
    userOrganisations?: OrganisationUser[]
  ): Promise<InnovationOverviewResult> {
    if (!id || !userId) {
      throw new Error(
        "Invalid parameters. You must define the id and the userId."
      );
    }

    const innovation = await this.findInnovation(
      id,
      userId,
      null,
      userOrganisations
    );

    const result: InnovationOverviewResult = {
      id: innovation.id,
      name: innovation.name,
      description: innovation.description,
      countryName: innovation.countryName,
      postcode: innovation.postcode,
      ownerId: innovation.owner,
      status: innovation.status,
    };

    return result;
  }

  async getAssessmentInnovationSummary(
    id: string
  ): Promise<AssessmentInnovationSummary> {
    const innovationFilterOptions: FindOneOptions = {
      relations: ["owner", "categories", "assessments", "assessments.assignTo"],
    };

    const innovation = await super.find(id, innovationFilterOptions);
    const b2cOwnerUser = await this.userService.getProfile(innovation.owner.id);

    // BUSINESS RULE. One user only belongs to 1 organisation.
    const company =
      b2cOwnerUser.organisations.length > 0 &&
      !b2cOwnerUser.organisations[0].isShadow
        ? b2cOwnerUser.organisations[0].name
        : null;

    const categories = await innovation.categories;

    const assessment = {
      id: null,
      assignToName: null,
    };

    // BUSINESS RULE: One innovation only has 1 assessment
    if (innovation.assessments.length > 0) {
      const b2cAssessmentUser = await this.userService.getProfile(
        innovation.assessments[0].assignTo.id
      );

      assessment.id = innovation.assessments[0].id;
      assessment.assignToName = b2cAssessmentUser.displayName;
    }

    return {
      summary: {
        id: innovation.id,
        name: innovation.name,
        status: innovation.status,
        company,
        countryName: innovation.countryName,
        postCode: innovation.postcode,
        description: innovation.description,
        categories: categories?.map((category) => category.type),
        otherCategoryDescription: innovation.otherCategoryDescription,
      },
      contact: {
        name: b2cOwnerUser.displayName,
        email: b2cOwnerUser.email,
        phone: b2cOwnerUser.phone,
      },
      assessment,
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

    const innovation = await this.findInnovation(id, userId, filterOptions);
    if (!innovation) {
      return null;
    }

    await this.repository.update(innovation.id, {
      submittedAt: new Date(),
      status: InnovationStatus.WAITING_NEEDS_ASSESSMENT,
      updatedBy: userId,
    });

    return {
      id: innovation.id,
      status: InnovationStatus.WAITING_NEEDS_ASSESSMENT,
    };
  }

  async addSupport(support: InnovationSupport): Promise<InnovationSupport> {
    support.status = InnovationSupportStatus.ENGAGING;
    return await this.supportRepo.save(support);
  }

  async updateSupportStatus(
    id: string,
    status: InnovationSupportStatus
  ): Promise<InnovationSupport> {
    const innovationSupport = await this.supportRepo.findOne(id);

    if (!innovationSupport) {
      throw new Error("Innovation Support Object not found.");
    }

    innovationSupport.status = status;

    return await this.supportRepo.save(innovationSupport);
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
      postCode: r.postcode,
      mainCategory: r.mainCategory,
      otherMainCategoryDescription: r.otherMainCategoryDescription,
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
