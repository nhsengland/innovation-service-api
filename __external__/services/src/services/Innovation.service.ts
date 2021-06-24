import {
  AccessorOrganisationRole,
  Innovation,
  InnovationAction,
  InnovationActionStatus,
  InnovationStatus,
  InnovationSupport,
  InnovationSupportStatus,
  InnovatorOrganisationRole,
  Organisation,
  OrganisationUnitUser,
  OrganisationUser
} from "@domain/index";
import {
  InnovationNotFoundError,
  InvalidParamsError,
  InvalidUserRoleError,
  MissingUserOrganisationError
} from "@services/errors";
import { getMergedArray, hasAccessorRole } from "@services/helpers";
import {
  InnovationListModel,
  InnovationViewModel
} from "@services/models/InnovationListModel";
import { ProfileModel } from "@services/models/ProfileModel";
import { ProfileSlimModel } from "@services/models/ProfileSlimModel";
import {
  Connection,
  FindManyOptions,
  FindOneOptions,
  getConnection,
  getRepository,
  In,
  IsNull,
  Repository
} from "typeorm";
import {
  AccessorInnovationSummary,
  AssessmentInnovationSummary,
  InnovatorInnovationSummary
} from "../models/InnovationSummaryResult";
import { BaseService } from "./Base.service";
import { UserService } from "./User.service";

export class InnovationService extends BaseService<Innovation> {
  private readonly connection: Connection;
  private readonly userService: UserService;
  private readonly supportRepo: Repository<InnovationSupport>;

  constructor(connectionName?: string) {
    super(Innovation, connectionName);
    this.connection = getConnection(connectionName);

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
      throw new InvalidParamsError(
        "Invalid params. You must define the user id and the innovation id."
      );
    }

    let role;
    let userOrganisation;
    const filterRelations = filter && filter.relations ? filter.relations : [];

    // BUSINESS RULE: An user has only one organization
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
        const organisationUnit =
          userOrganisation.userOrganisationUnits[0].organisationUnit;

        filterOptions = {
          relations: getMergedArray(
            ["innovationSupports", "assessments"],
            filterRelations
          ),
          where: `organisation_unit_id = '${organisationUnit.id}'`,
        };
        break;
      case AccessorOrganisationRole.QUALIFYING_ACCESSOR:
        filterOptions = {
          relations: getMergedArray(
            ["organisationShares", "assessments"],
            filterRelations
          ),
          where: `Innovation_Innovation__organisationShares.organisation_id = '${userOrganisation.organisation.id}'`,
        };
        break;
      default:
        throw new InvalidUserRoleError("Invalid user role.");
    }

    return super.find(innovationId, filterOptions);
  }

  async findAllByAccessorAndSupportStatus(
    userId: string,
    userOrganisations: OrganisationUser[],
    supportStatus: string,
    assignedToMe: boolean,
    skip: number,
    take: number,
    order?: { [key: string]: string }
  ) {
    if (!userId) {
      throw new InvalidParamsError(
        "Invalid userId. You must define the accessor id."
      );
    }

    if (!userOrganisations || userOrganisations.length == 0) {
      throw new MissingUserOrganisationError(
        "Invalid user. User has no organisations."
      );
    }

    // BUSINESS RULE: An accessor has only one organization
    const userOrganisation = userOrganisations[0];

    if (!hasAccessorRole(userOrganisation.role)) {
      throw new InvalidUserRoleError("Invalid user. User has an invalid role.");
    }

    // BUSINESS RULE: An user has only one organization unit
    const organisationUnit =
      userOrganisation.userOrganisationUnits[0].organisationUnit;

    const filterOptions = {
      relations: [
        "innovationSupports",
        "innovationSupports.organisationUnit",
        "innovationSupports.organisationUnitUsers",
        "innovationSupports.organisationUnitUsers.organisationUser",
        "innovationSupports.organisationUnitUsers.organisationUser.user",
        "assessments",
      ],
      where: {},
      skip,
      take,
      order: order || { createdAt: "DESC" },
    };

    if (
      userOrganisation.role === AccessorOrganisationRole.QUALIFYING_ACCESSOR
    ) {
      filterOptions.where = `Innovation_Innovation__organisationShares.organisation_id = '${userOrganisation.organisation.id}'`;
      filterOptions.where += ` and Innovation.status = '${InnovationStatus.IN_PROGRESS}'`;

      // With status UNASSIGNED should pick innovations without a record on the table innovation_support for the unit
      if (supportStatus === InnovationSupportStatus.UNASSIGNED) {
        filterOptions.relations = ["organisationShares", "assessments"];
        filterOptions.where += ` and NOT EXISTS(SELECT 1 FROM innovation_support tmp WHERE tmp.innovation_id = Innovation.id and tmp.organisation_unit_id = '${organisationUnit.id}')`;
      } else {
        filterOptions.relations = [
          "organisationShares",
          ...filterOptions.relations,
        ];

        filterOptions.where += ` and Innovation__innovationSupports.status = '${supportStatus}'`;
        filterOptions.where += ` and Innovation__innovationSupports.organisation_unit_id = '${organisationUnit.id}'`;
      }
    } else {
      filterOptions.where = `Innovation__innovationSupports.organisation_unit_id = '${organisationUnit.id}'`;
      filterOptions.where += ` and Innovation.status = '${InnovationStatus.IN_PROGRESS}'`;
      filterOptions.where += ` and Innovation__innovationSupports.status = '${supportStatus}'`;
    }

    // Filter assignedToMe innovations (innovation_support_user)
    if (assignedToMe && supportStatus !== InnovationSupportStatus.UNASSIGNED) {
      filterOptions.where += ` and user_id = '${userId}'`;
    }

    const innovations = await this.repository.findAndCount(filterOptions);
    // If no records = quick return
    if (innovations[1] === 0) {
      return {
        data: [],
        count: 0,
      };
    }

    let b2cUserNames: { [key: string]: string };
    if (
      supportStatus === InnovationSupportStatus.ENGAGING ||
      supportStatus === InnovationSupportStatus.COMPLETE
    ) {
      const userIds = innovations[0].flatMap((inno: Innovation) => {
        const innovationSupport = inno.innovationSupports.find(
          (is: InnovationSupport) =>
            is.organisationUnit.id === organisationUnit.id
        );

        return innovationSupport.organisationUnitUsers.map(
          (ouu: OrganisationUnitUser) => ouu.organisationUser.user.id
        );
      });

      const b2cUsers = await this.userService.getListOfUsers(userIds);
      b2cUserNames = b2cUsers.reduce((map, obj) => {
        map[obj.id] = obj.displayName;
        return map;
      }, {});
    }

    // GRAB THE ORGANISATION MAP THAT SHOULD LOOK LIKE THIS:
    /*
      {
        'ABC-DEF-GHI-JKL': ['ASHN', 'NICE'],
        'XPT-OFG-JKH-IUO': ['NICE'],
        ...
      }
    */
    const organisationsMap = await this.getOrganisationsMap(innovations[0])

    const result = {
      data: innovations[0]?.map((inno: Innovation) => {
        const innovationSupport = inno.innovationSupports?.find(
          (is: InnovationSupport) =>
            is.organisationUnit.id === organisationUnit.id
        );


        const support = innovationSupport
          ? {
              id: innovationSupport.id,
              status: innovationSupport.status,
              createdAt: innovationSupport.createdAt,
              updatedAt: innovationSupport.updatedAt,
              accessors: innovationSupport.organisationUnitUsers?.map(
                (oou: OrganisationUnitUser) => ({
                  id: oou.organisationUser.id,
                  name: b2cUserNames[oou.organisationUser.user.id],
                })
              ),
            }
          : { status: InnovationSupportStatus.UNASSIGNED };

        return {
          id: inno.id,
          name: inno.name,
          submittedAt: inno.submittedAt,
          mainCategory: inno.mainCategory,
          otherMainCategoryDescription: inno.otherMainCategoryDescription,
          countryName: inno.countryName,
          postcode: inno.postcode,
          support,
          assessment:
            inno.assessments.length > 0
              ? { id: inno.assessments[0].id }
              : { id: null },
          // GRAB THE ORGANISATION ACRONYMS ARRAY FROM THE MAP BY THE KEY = INNOVATION ID
          organisations: organisationsMap[inno.id] || [],
        };
      }),
      count: innovations[1],
    };

    return result;
  }

  async findAllByInnovator(
    userId: string,
    filter?: any
  ): Promise<Innovation[]> {
    if (!userId) {
      throw new InvalidParamsError(
        "Invalid userId. You must define the owner."
      );
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
  ): Promise<InnovatorInnovationSummary> {
    if (!id || !userId) {
      throw new InvalidParamsError(
        "Invalid parameters. You must define the id and the userId."
      );
    }

    const innovation = await this.findInnovation(id, userId);

    const result: InnovatorInnovationSummary = {
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

  async getAccessorInnovationSummary(
    id: string,
    userId: string,
    userOrganisations: OrganisationUser[]
  ): Promise<AccessorInnovationSummary> {
    if (!id || !userId) {
      throw new InvalidParamsError(
        "Invalid parameters. You must define the id and the userId."
      );
    }

    if (!userOrganisations || userOrganisations.length == 0) {
      throw new MissingUserOrganisationError(
        "Invalid user. User has no organisations."
      );
    }

    const filterOptions = {
      relations: [
        "owner",
        "innovationSupports",
        "innovationSupports.organisationUnit",
        "categories",
        "assessments",
      ],
    };
    const innovation = await this.findInnovation(
      id,
      userId,
      filterOptions,
      userOrganisations
    );
    if (!innovation) {
      throw new InnovationNotFoundError("Innovation not found for the user.");
    }

    const b2cOwnerUser = await this.userService.getProfile(innovation.owner.id);
    const categories = await innovation.categories;

    // BUSINESS RULE: One innovation only has 1 assessment
    const assessment = {
      id: null,
    };

    if (innovation.assessments.length > 0) {
      assessment.id = innovation.assessments[0].id;
    }

    // BUSINESS RULE: An user has only one organization unit
    const organisationUnit =
      userOrganisations[0].userOrganisationUnits[0].organisationUnit;

    const support = {
      id: null,
      status: null,
    };
    const innovationSupport: InnovationSupport = innovation?.innovationSupports.find(
      (is: InnovationSupport) => is.organisationUnit.id === organisationUnit.id
    );

    if (innovationSupport) {
      support.id = innovationSupport.id;
      support.status = innovationSupport.status;
    }

    return {
      summary: {
        id: innovation.id,
        name: innovation.name,
        status: innovation.status,
        company: this.getUserOrganisationName(b2cOwnerUser),
        countryName: innovation.countryName,
        postCode: innovation.postcode,
        description: innovation.description,
        categories: categories?.map((category) => category.type),
        otherCategoryDescription: innovation.otherCategoryDescription,
      },
      contact: {
        name: b2cOwnerUser.displayName,
      },
      assessment,
      support,
    };
  }

  async getAssessmentInnovationSummary(
    id: string
  ): Promise<AssessmentInnovationSummary> {
    const innovationFilterOptions: FindOneOptions = {
      relations: ["owner", "categories", "assessments", "assessments.assignTo"],
    };

    const innovation = await super.find(id, innovationFilterOptions);
    const b2cOwnerUser = await this.userService.getProfile(innovation.owner.id);
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
        company: this.getUserOrganisationName(b2cOwnerUser),
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
    take: number,
    order?: { [key: string]: string }
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
      order: order || { createdAt: "DESC" },
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
      throw new InvalidParamsError(
        "Invalid parameters. You must define the id and the userId."
      );
    }

    const filterOptions: FindOneOptions = {
      where: { owner: userId, status: InnovationStatus.CREATED },
      loadRelationIds: true,
    };

    const innovation = await this.findInnovation(id, userId, filterOptions);
    if (!innovation) {
      throw new InnovationNotFoundError("Innovation not found for the user.");
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

  async getOrganisationShares(innovationId: string, userId: string) {
    if (!innovationId || !userId) {
      throw new InvalidParamsError(
        "Invalid parameters. You must define the innovationId and the userId."
      );
    }

    const filterOptions = {
      relations: [
        "organisationShares",
        "innovationSupports",
        "innovationSupports.organisationUnit",
        "innovationSupports.organisationUnit.organisation",
      ],
      where: { owner: userId },
    };
    const innovation = await this.findInnovation(
      innovationId,
      userId,
      filterOptions
    );
    if (!innovation) {
      throw new InnovationNotFoundError("Innovation not found for the user.");
    }

    const supports = innovation.innovationSupports;
    const shares = innovation.organisationShares;

    const result = shares?.map((os: Organisation) => {
      const organisationSupports = supports.filter(
        (is: InnovationSupport) => is.organisationUnit.organisation.id === os.id
      );

      let status: InnovationSupportStatus = InnovationSupportStatus.UNASSIGNED;
      if (organisationSupports.length === 1) {
        status = organisationSupports[0].status;
      } else if (organisationSupports.length > 1) {
        const idx = organisationSupports.findIndex(
          (is: InnovationSupport) =>
            is.status != InnovationSupportStatus.COMPLETE &&
            is.status != InnovationSupportStatus.WITHDRAWN &&
            is.status != InnovationSupportStatus.UNSUITABLE
        );

        if (idx !== -1) {
          status = organisationSupports[idx].status;
        } else {
          status = organisationSupports[0].status;
        }
      }

      return {
        id: os.id,
        status,
      };
    });

    return result;
  }

  async updateOrganisationShares(
    innovationId: string,
    userId: string,
    organisations: string[]
  ) {
    if (!innovationId || !userId) {
      throw new InvalidParamsError(
        "Invalid parameters. You must define the innovationId and the userId."
      );
    }

    if (!organisations || organisations.length < 1) {
      throw new InvalidParamsError(
        "Invalid parameters. You must define at least one organisation."
      );
    }

    const filterOptions = {
      relations: [
        "organisationShares",
        "innovationSupports",
        "innovationSupports.organisationUnit",
        "innovationSupports.organisationUnit.organisation",
      ],
      where: { owner: userId },
    };
    const innovation = await this.findInnovation(
      innovationId,
      userId,
      filterOptions
    );
    if (!innovation) {
      throw new InnovationNotFoundError("Innovation not found for the user.");
    }

    const supports = innovation.innovationSupports;
    const shares = innovation.organisationShares;

    const deletedShares = shares.filter(
      (org: Organisation) => !organisations.includes(org.id)
    );

    return await this.connection.transaction(async (transactionManager) => {
      for (let orgIdx = 0; orgIdx < deletedShares.length; orgIdx++) {
        const organisationSupports = supports.filter(
          (ia: InnovationSupport) =>
            ia.organisationUnit.organisation.id === deletedShares[orgIdx].id
        );

        if (organisationSupports.length > 0) {
          for (
            let orgSupIdx = 0;
            orgSupIdx < organisationSupports.length;
            orgSupIdx++
          ) {
            const innovationSupport = organisationSupports[orgSupIdx];
            innovationSupport.organisationUnitUsers = [];

            const innovationActions = await innovationSupport.actions;
            const actions = innovationActions.filter(
              (ia: InnovationAction) =>
                ia.status === InnovationActionStatus.REQUESTED ||
                ia.status === InnovationActionStatus.STARTED ||
                ia.status === InnovationActionStatus.IN_REVIEW
            );

            for (let actionIdx = 0; actionIdx < actions.length; actionIdx++) {
              await transactionManager.update(
                InnovationAction,
                { id: actions[actionIdx].id },
                { status: InnovationActionStatus.DECLINED, updatedBy: userId }
              );
            }

            innovationSupport.status = InnovationSupportStatus.UNASSIGNED;
            innovationSupport.updatedBy = userId;
            innovationSupport.deletedAt = new Date();

            await transactionManager.save(InnovationSupport, innovationSupport);
          }
        }
      }

      innovation.updatedBy = userId;
      innovation.organisationShares = organisations.map((id: string) =>
        Organisation.new({ id })
      );

      return await transactionManager.save(Innovation, innovation);
    });
  }

  private getUserOrganisationName(user: ProfileModel) {
    // BUSINESS RULE. One user only belongs to 1 organisation.
    return user.organisations.length > 0 && !user.organisations[0].isShadow
      ? user.organisations[0].name
      : null;
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

  private async getOrganisationsMap(innovations: Innovation[]): Promise<{[key:string]: string[]} | []> {

    const innovationIds: string[] = innovations.map(o => o.id);
    //return await this.supportRepo.findByInnovationIds(innovationIds) || [];
    // FROM THE INNOVATIONS PASSED IN
    // GRAB THE SUPPORTS WITH THE STATUS = ENGAGING

    const supports = await this.supportRepo.find({
      where: {
        innovation: In( innovationIds ),
        status:  InnovationSupportStatus.ENGAGING
      },
      relations: [
        'innovation',
        'organisationUnit',
        'organisationUnit.organisation'
      ]
    });

    let supportMap =  { };

    // IF ANY SUPPORT MEETS THE CRITERIA
    // LOOP THROUGH THE RESULTS
    for (let index = 0; index < supports.length; index++) {
      // GRAB THE SUPPORT ELEMENT
      const element = supports[index];
      // GRAB THE ORG ACRONYM
      const organisation = element.organisationUnit.organisation.acronym;
      // TRY TO GET KEY VALUE
      const entry = supportMap[element.innovation.id];
      // IF IT IS NON EXISTENT CREATE AN ENTRY IN THE ARRAY
      if (!entry) {
        supportMap[element.innovation.id] = {
          organisations: [ organisation ]
        }
      } else {
        // OTHERWISE PUSH THE ACRONYM INTO THE ARRAY
        supportMap[element.innovation.id].push(organisation);
      }
    }

    /*
      RETURN THE MAP WHICH SHOULD LOOK LIKE
      {
        'ABC-DEF-GHI-JKL': ['ASHN', 'NICE'],
        'XPT-OFG-JKH-IUO': ['NICE'],
        ...
      }
    */
    return supportMap;
  }
}
