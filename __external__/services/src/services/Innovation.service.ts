import {
  AccessorOrganisationRole,
  Innovation,
  InnovationAction,
  InnovationActionStatus,
  InnovationAssessment,
  InnovationSection,
  InnovationSectionCatalogue,
  InnovationSectionStatus,
  InnovationStatus,
  InnovationSupport,
  InnovationSupportStatus,
  NotificationAudience,
  NotificationContextType,
  Organisation,
  OrganisationUnitUser,
  UserType,
} from "@domain/index";
import {
  InnovationNotFoundError,
  InvalidParamsError,
  InvalidSectionStateError,
  InvalidUserRoleError,
  InvalidUserTypeError,
  MissingUserOrganisationError,
} from "@services/errors";
import {
  checkIfValidUUID,
  getMergedArray,
  hasAccessorRole,
} from "@services/helpers";
import {
  InnovationListModel,
  InnovationViewModel,
} from "@services/models/InnovationListModel";
import { InnovationSectionModel } from "@services/models/InnovationSectionModel";
import { ProfileModel } from "@services/models/ProfileModel";
import { ProfileSlimModel } from "@services/models/ProfileSlimModel";
import { RequestUser } from "@services/models/RequestUser";
import { SimpleResult } from "@services/models/SimpleResult";
import {
  Connection,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  getConnection,
  getRepository,
  In,
  IsNull,
  Repository,
  SelectQueryBuilder,
} from "typeorm";
import {
  AccessorInnovationSummary,
  AssessmentInnovationSummary,
  InnovatorInnovationSummary,
} from "../models/InnovationSummaryResult";
import { BaseService } from "./Base.service";
import { LoggerService } from "./Logger.service";
import { NotificationService } from "./Notification.service";
import { UserService } from "./User.service";

import * as constants from "../../../../utils/constants";
import { InnovationCreationModel } from "@services/models/InnovationCreationModel";
import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import { OrderByClauseType, SupportFilter } from "@services/types";
import { Activity } from "@domain/enums/activity.enums";
import { ActivityLogService } from "./ActivityLog.service";

export class InnovationService extends BaseService<Innovation> {
  private readonly connection: Connection;
  private readonly userService: UserService;
  private readonly supportRepo: Repository<InnovationSupport>;
  private readonly notificationService: NotificationService;
  private readonly logService: LoggerService;
  private readonly activityLogService: ActivityLogService;
  private readonly organisationRepo: Repository<Organisation>;

  constructor(connectionName?: string) {
    super(Innovation, connectionName);
    this.connection = getConnection(connectionName);

    this.userService = new UserService(connectionName);
    this.notificationService = new NotificationService(connectionName);
    this.supportRepo = getRepository(InnovationSupport, connectionName);
    this.activityLogService = new ActivityLogService(connectionName);
    this.logService = new LoggerService();
    this.organisationRepo = getRepository(Organisation, connectionName);
  }

  async createInnovation(
    requestUser: RequestUser,
    innovation: InnovationCreationModel
  ) {
    if (!requestUser || !innovation) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    if (requestUser.type !== UserType.INNOVATOR) {
      throw new InvalidUserTypeError("Invalid user type.");
    }

    const _innovation = Innovation.new({
      ...innovation,
      owner: { id: requestUser.id },
      createdBy: requestUser.id,
      updatedBy: requestUser.id,
      status: InnovationStatus.CREATED,
      organisationShares: innovation.organisationShares.map((id) => ({ id })),
    });

    //const result = await this.repository.save(_innovation);
    const result = await this.connection.transaction(async (trs) => {
      const innov = await trs.save(Innovation, _innovation);
      try {
        await this.createActivityLog(
          requestUser,
          innov,
          Activity.INNOVATION_CREATION,
          trs
        );
      } catch (error) {
        this.logService.error(
          `An error has occured while creating activity log from ${requestUser.id}`,
          error
        );

        throw error;
      }

      try {
        await this.saveSection(
          requestUser,
          innov,
          trs,
          InnovationSectionCatalogue.INNOVATION_DESCRIPTION
        );
      } catch (error) {
        this.logService.error(
          `An error has occured while creating section from ${requestUser.id}`,
          error
        );
        throw error;
      }
      return innov;
    });

    return result;
  }

  async findInnovation(
    requestUser: RequestUser,
    innovationId: string,
    filter?: any
  ) {
    if (!requestUser || !innovationId || !checkIfValidUUID(innovationId)) {
      throw new InvalidParamsError(
        "Invalid params. You must define the user id and the innovation id."
      );
    }

    const filterRelations = filter && filter.relations ? filter.relations : [];

    let filterOptions;
    switch (requestUser.type) {
      case UserType.INNOVATOR:
        filterOptions = filter
          ? filter
          : {
              where: { owner: requestUser.id },
              loadRelationIds: true,
            };
        break;
      case UserType.ACCESSOR:
        const organisationUser = requestUser.organisationUser;

        if (
          organisationUser.role === AccessorOrganisationRole.QUALIFYING_ACCESSOR
        ) {
          filterOptions = {
            relations: getMergedArray(
              ["organisationShares", "assessments"],
              filterRelations
            ),
            where: `Innovation_Innovation__organisationShares.organisation_id = '${organisationUser.organisation.id}'`,
          };
        } else {
          const organisationUnitUser = requestUser.organisationUnitUser;

          filterOptions = {
            relations: getMergedArray(
              ["innovationSupports", "assessments"],
              filterRelations
            ),
            where: `Innovation__innovationSupports.organisation_unit_id = '${organisationUnitUser.organisationUnit.id}'`,
          };
        }

        break;
      case UserType.ASSESSMENT:
        filterOptions = filter
          ? filter
          : {
              loadRelationIds: true,
            };
        break;
      default:
        throw new InvalidUserRoleError("Invalid user role.");
    }

    return super.find(innovationId, filterOptions);
  }

  async findInnovationSections(
    innovationId: string
  ): Promise<InnovationSection[]> {
    Innovation;
    const innovation = await super.find(innovationId, {
      relations: ["sections"],
    });

    return await innovation.sections;
  }

  async findAllByAccessorAndSupportStatus(
    requestUser: RequestUser,
    supportStatus: InnovationSupportStatus,
    assignedToMe: boolean,
    suggestedOnly: boolean,
    skip: number,
    take: number,
    order?: { [key: string]: string }
  ) {
    if (!requestUser) {
      throw new InvalidParamsError(
        "Invalid userId. You must define the accessor id."
      );
    }

    if (!requestUser.organisationUser) {
      throw new MissingUserOrganisationError(
        "Invalid user. User has no organisations."
      );
    }
    const organisationUser = requestUser.organisationUser;

    if (!hasAccessorRole(organisationUser.role)) {
      throw new InvalidUserRoleError("Invalid user. User has an invalid role.");
    }

    const organisationUnit = requestUser.organisationUnitUser.organisationUnit;

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
      organisationUser.role === AccessorOrganisationRole.QUALIFYING_ACCESSOR
    ) {
      filterOptions.where = `Innovation_Innovation__organisationShares.organisation_id = '${organisationUser.organisation.id}'`;
      filterOptions.where += ` and Innovation.status = '${InnovationStatus.IN_PROGRESS}'`;

      // With status UNASSIGNED should pick innovations without a record on the table innovation_support for the unit
      if (supportStatus === InnovationSupportStatus.UNASSIGNED) {
        filterOptions.relations = ["organisationShares", "assessments"];
        filterOptions.where += ` and NOT EXISTS(SELECT 1 FROM innovation_support tmp WHERE tmp.innovation_id = Innovation.id and deleted_at is null and tmp.organisation_unit_id = '${organisationUnit.id}')`;

        if (suggestedOnly) {
          filterOptions.where += ` and EXISTS (SELECT 1 FROM innovation_assessment A INNER JOIN innovation_assessment_organisation_unit B ON A.ID = B.innovation_assessment_id WHERE B.organisation_unit_id = '${organisationUnit.id}' AND A.innovation_id = Innovation.id)`;
        }
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

      // TODO: ACCESSORS CAN ONLY SEE [COMPLETE AND ENGAGING]
      // RIGHT NOW THIS IS ONLY ENFORCED ON THE CLIENT.
      // THIS SHOULD FILTER OUT SUPPORT STATUSES DIFFERENT FROM COMPLETE OR ENGAGING.
      filterOptions.where += ` and Innovation__innovationSupports.status = '${supportStatus}'`;
    }

    // Filter assignedToMe innovations (innovation_support_user)
    if (assignedToMe && supportStatus !== InnovationSupportStatus.UNASSIGNED) {
      filterOptions.where += ` and user_id = '${requestUser.id}'`;
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
          (ouu: OrganisationUnitUser) => ouu.organisationUser.user.externalId
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
    const organisationsMap = await this.getOrganisationsMap(innovations[0]);
    const notifications = await this.notificationService.getUnreadNotifications(
      requestUser
    );

    const aggregatedNotifications = await this.notificationService.getNotificationsGroupedBySupportStatus(
      requestUser
    );

    const result = {
      data: innovations[0]?.map((inno: Innovation) => {
        const unread = notifications.filter((n) => n.innovationId === inno.id);

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
                  name: b2cUserNames[oou.organisationUser.user.externalId],
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
          notifications: {
            count: unread?.length || 0,
            hasNew:
              unread.filter(
                (u) => u.contextType === NotificationContextType.INNOVATION
              ).length > 0 && !support.id,
          },
        };
      }),
      count: innovations[1],
      tabInfo: aggregatedNotifications,
    };

    return result;
  }

  async findAllAdvanced(
    requestUser: RequestUser,
    name: string,
    assignedToMe: boolean,
    suggestedOnly: boolean,
    categories: string[],
    locations: string[],
    organisations: string[],
    supportStatuses: string[],
    skip: number,
    take: number,
    order?: { [key: string]: string }
  ): Promise<{
    data: [
      {
        id: string;
        name: string;
        submittedAt: string;
        mainCategory: string;
        otherMainCategoryDescription: string;
        countryName: string;
        postcode: string;
        supportStatus: string;
      }
    ];
    count: number;
  }> {
    if (!requestUser) {
      throw new InvalidParamsError(
        "Invalid userId. You must define the accessor id."
      );
    }

    if (!requestUser.organisationUser) {
      throw new MissingUserOrganisationError(
        "Invalid user. User has no organisations."
      );
    }
    const organisationUser = requestUser.organisationUser;

    if (!hasAccessorRole(organisationUser.role)) {
      throw new InvalidUserRoleError("Invalid user. User has an invalid role.");
    }

    const organisationUnit = requestUser.organisationUnitUser.organisationUnit;

    const query = this.repository
      .createQueryBuilder("innovations")
      .distinct()
      .select("innovations.id", "id")
      .addSelect("innovations.name", "name")
      .addSelect("innovations.submitted_at", "submittedAt")
      .addSelect("innovations.main_category", "mainCategory")
      .addSelect(
        "innovations.other_main_category_description",
        "otherMainCategoryDescription"
      )
      .addSelect("innovations.country_name", "countryName")
      .addSelect("innovations.postcode", "postcode")
      .addSelect("support.status", "supportStatus")
      .addSelect("innovations.created_at", "createdAt")
      // may not have any sharing preferences
      .innerJoin(
        "innovation_share",
        "share",
        "innovations.id = share.innovation_id"
      )
      // may not have any assessment
      // DOUBLE CHECK THIS. DOES IT NEED TO BE AN ASSESSMENT?
      .innerJoin(
        "innovation_assessment",
        "assessment",
        "innovations.id = assessment.innovation_id"
      )
      // NOT SURE IF AN ASSESSMENT CAN EXIST WITHOUT AT LEAST ONE ORG WHEN ITS COMPLETED
      // MAKES SENSE THAT IT CAN EXIST, BECAUSE THE ASSESSMENT CAN BE NEGATIVE.
      .leftJoin(
        "innovation_assessment_organisation_unit",
        "assessment_organisation",
        "assessment.id = assessment_organisation.innovation_assessment_id"
      )
      // may not have any support
      .leftJoin(
        "innovation_support",
        "support",
        "innovations.id = support.innovation_id"
      )
      // may not have assigned users
      .leftJoin(
        "innovation_support_user",
        "support_user",
        "support.id = support_user.innovation_support_id"
      )
      .leftJoin(
        "organisation_unit",
        "orgSupportUnit",
        `support.organisation_unit_id = orgSupportUnit.id and support.status = '${InnovationSupportStatus.ENGAGING}'`
      )
      .where("innovations.status in (:...status)", {
        status: [InnovationStatus.IN_PROGRESS, InnovationStatus.COMPLETE],
      });

    // Pre conditions for the main set

    /**
     * RULES:
     * IF YOU ARE A QUALIFYING ACCESSOR, YOU CAN SEE ALL STATUSES
     * IF YOU ARE AN ACCESSOR, YOU CAN ONLY SEE INNOVATIONS THAT YOUR UNIT CURRENTLY SUPPORTS AND WITH
     * THE FOLLOWING STATUSES: [ENGAGING, COMPLETE]
     *
     * THIS IF BLOCK NEEDS TO ACCOUNTS FOR ALL OF THE ABOVE RULES.
     */

    if (
      organisationUser.role === AccessorOrganisationRole.QUALIFYING_ACCESSOR
    ) {
      // when the request user is a QA, we want innovations submited for assessment (status IN_PROGRESS)
      // and that have the QA organisation on the sharing preferences
      query.andWhere("share.organisation_id = :organisationId", {
        organisationId: organisationUser.organisation.id,
      });

      if (supportStatuses && supportStatuses.length > 0) {
        if (supportStatuses.includes(InnovationSupportStatus.UNASSIGNED)) {
          query.andWhere(
            "(support.status in (:...supportStatuses) OR support.status IS NULL)",
            { supportStatuses }
          );
        } else {
          query.andWhere("support.status in (:...supportStatuses)", {
            supportStatuses,
          });
        }
      }
    }

    if (organisationUser.role === AccessorOrganisationRole.ACCESSOR) {
      // When the request user is a regular Accessor
      // we want innovations that have the Accessor's unit on the support table

      query.andWhere("support.status in (:...status)", {
        status: [
          InnovationSupportStatus.ENGAGING,
          InnovationSupportStatus.COMPLETE,
        ],
      });

      query.andWhere("support.organisation_unit_id = :unitId ", {
        unitId: organisationUnit.id,
      });

      if (supportStatuses && supportStatuses.length > 0) {
        query.andWhere("support.status in (:...supportStatuses)", {
          supportStatuses,
        });
      }
    }

    // Filters

    // Name
    if (name && name.trim().length > 0) {
      query.andWhere("innovations.name like :name", {
        name: `%${name.trim().toLocaleLowerCase()}%`,
      });
    }
    // Main Categories
    if (categories && categories.length > 0) {
      query.andWhere("innovations.main_category in (:...categories)", {
        categories,
      });
    }

    // Locations
    if (locations && locations.length > 0) {
      locations = locations.map((l) => l.toLocaleLowerCase());

      if (!locations.includes("based outside uk")) {
        query.andWhere("innovations.country_name in (:...locations)", {
          locations,
        });
      } else {
        // matches every location that is not in part of the UK except the ones included in the locations list.
        locations = locations.filter((o) => o !== "based outside uk");

        const excluded = constants.locations.filter(
          (a) => !locations.includes(a)
        );

        // this works because excluded and contants.locations are isolated.
        // We could use a element comparison algorithm but this provides better time complexity.
        // if excluded is [A,B,C] and the constants.location is [A,B,C] (independent of order)
        // then this condition is true.
        // on the other hand, if excluded is [A,C] then it is not matched.
        if (excluded.length === constants.locations.length) {
          query.andWhere("innovations.country_name NOT in (:...excluded)", {
            locations,
            excluded,
          });
        } else {
          query.andWhere(
            "innovations.country_name in (:...locations) OR innovations.country_name NOT in (:...excluded)",
            { locations, excluded }
          );
        }
      }
    }

    // Engaging organisations
    if (organisations && organisations.length > 0) {
      // MUST GRAB THE UNIT ID'S OF THE ORGS
      // OR CHANGE THIS QUERY TO JOIN WITH THE ORGANISATION TABLE
      query.andWhere(" orgSupportUnit.organisation_id in (:...organisations)", {
        organisations,
      });
    }

    // Assigned To Me
    if (assignedToMe) {
      query.andWhere("support_user.organisation_unit_user_id = :userId", {
        userId: requestUser.organisationUnitUser.id,
      });
    }

    if (suggestedOnly) {
      query.andWhere("assessment_organisation.organisation_unit_id = :unitId", {
        unitId: requestUser.organisationUnitUser.organisationUnit.id,
      });
    }

    if (order) {
      for (const key of Object.keys(order)) {
        query.addOrderBy(key, order[key] as "ASC" | "DESC");
      }
    } else {
      query.addOrderBy("innovations.created_at", "DESC");
    }

    query.skip(skip);
    query.take(take);

    const result = await query.execute();

    const data = result.map((r) => ({
      id: r.id,
      name: r.name,
      submittedAt: r.submittedAt,
      mainCategory: r.mainCategory,
      otherMainCategoryDescription: r.otherMainCategoryDescription,
      countryName: r.countryName,
      postcode: r.postcode,
      supportStatus: r.supportStatus,
    }));

    return {
      data,
      count: data.length as number,
    };
  }

  async findAllByInnovator(
    requestUser: RequestUser,
    filter?: any
  ): Promise<SimpleResult[]> {
    if (!requestUser) {
      throw new InvalidParamsError(
        "Invalid params. You must define the request user."
      );
    }

    const filterOptions = {
      ...filter,
      owner: requestUser.id,
    };

    const innovations = await this.repository.find(filterOptions);

    return innovations?.map((innovation) => ({
      id: innovation.id,
      name: innovation.name,
    }));
  }

  async getInnovationOverview(
    requestUser: RequestUser,
    id: string
  ): Promise<InnovatorInnovationSummary> {
    if (!id || !requestUser || !checkIfValidUUID(id)) {
      throw new InvalidParamsError(
        "Invalid parameters. You must define the id and the request user."
      );
    }

    const query = this.repository
      .createQueryBuilder("innovation")
      .leftJoinAndSelect("innovation.assessments", "assessments")
      .leftJoinAndSelect("innovation.sections", "sections")
      .leftJoinAndSelect("sections.actions", "actions")
      .where("innovation.id = :id and innovation.owner_id = :userId", {
        id,
        userId: requestUser.id,
      });

    const innovation = await query.getOne();
    if (!innovation) {
      throw new InnovationNotFoundError(
        "Invalid parameters. Innovation not found for the user."
      );
    }

    // BUSINESS RULE: One innovation only has 1 assessment
    const assessment = {
      id: null,
    };

    if (innovation.assessments.length > 0) {
      assessment.id = innovation.assessments[0].id;
    }

    const sections = await innovation.sections;
    const actions = {
      requestedCount: 0,
      inReviewCount: 0,
    };

    sections?.forEach((section: any) => {
      section.__actions__?.forEach((action: InnovationAction) => {
        if (action.status === InnovationActionStatus.IN_REVIEW) {
          actions.inReviewCount++;
        } else if (action.status === InnovationActionStatus.REQUESTED) {
          actions.requestedCount++;
        }
      });
    });

    const result: InnovatorInnovationSummary = {
      id: innovation.id,
      name: innovation.name,
      description: innovation.description,
      countryName: innovation.countryName,
      postcode: innovation.postcode,
      ownerId: innovation.owner,
      status: innovation.status,
      submittedAt: innovation.submittedAt,
      assessment,
      actions,
    };

    return result;
  }

  async getAccessorInnovationSummary(
    requestUser: RequestUser,
    id: string
  ): Promise<AccessorInnovationSummary> {
    if (!id || !requestUser || !checkIfValidUUID(id)) {
      throw new InvalidParamsError(
        "Invalid parameters. You must define the id and the request user."
      );
    }

    if (!requestUser.organisationUser) {
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
      requestUser,
      id,
      filterOptions
    );
    if (!innovation) {
      throw new InnovationNotFoundError("Innovation not found for the user.");
    }

    const b2cOwnerUser = await this.userService.getProfile(
      innovation.owner.id,
      innovation.owner.externalId
    );
    const categories = await innovation.categories;

    // BUSINESS RULE: One innovation only has 1 assessment
    const assessment = {
      id: null,
    };

    if (innovation.assessments.length > 0) {
      assessment.id = innovation.assessments[0].id;
    }

    const organisationUnit = requestUser.organisationUnitUser.organisationUnit;

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

    //Create object to show warning message in case innovation owner is locked
    let isUserLocked = false;
    let userName: string;
    const userDetails = await this.userService.getUserDetails(
      innovation.owner.externalId,
      "FULL"
    );

    if (userDetails.lockedAt != null) {
      isUserLocked = true;
      userName = userDetails.displayName;
    }

    const lockedInnovatorValidation = {
      displayIsInnovatorLocked: isUserLocked,
      innovatorName: userName,
    };

    return {
      summary: {
        id: innovation.id,
        name: innovation.name,
        status: innovation.status,
        company: this.getUserOrganisationName(b2cOwnerUser),
        companySize: this.getUserOrganisationSize(b2cOwnerUser),
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
      lockedInnovatorValidation,
    };
  }

  async getAssessmentInnovationSummary(
    requestUser: RequestUser,
    id: string
  ): Promise<AssessmentInnovationSummary> {
    if (!id || !requestUser || !checkIfValidUUID(id)) {
      throw new InvalidParamsError(
        "Invalid parameters. You must define the id and the request user."
      );
    }

    const innovationFilterOptions: FindOneOptions = {
      relations: ["owner", "categories", "assessments", "assessments.assignTo"],
    };

    const innovation = await super.find(id, innovationFilterOptions);
    const b2cOwnerUser = await this.userService.getProfile(
      innovation.owner.id,
      innovation.owner.externalId
    );
    const categories = await innovation.categories;

    const assessment = {
      id: null,
      assignToName: null,
    };

    // BUSINESS RULE: One innovation only has 1 assessment
    if (innovation.assessments.length > 0) {
      const b2cAssessmentUser = await this.userService.getProfile(
        innovation.assessments[0].assignTo.id,
        innovation.assessments[0].assignTo.externalId
      );

      assessment.id = innovation.assessments[0].id;
      assessment.assignToName = b2cAssessmentUser.displayName;
    }

    //Create object to show warning message in case innovation owner is locked
    let isUserLocked = false;
    let userName: string;
    const userDetails = await this.userService.getUserDetails(
      innovation.owner.externalId,
      "FULL"
    );

    if (userDetails.lockedAt != null) {
      isUserLocked = true;
      userName = userDetails.displayName;
    }

    const lockedInnovatorValidation = {
      displayIsInnovatorLocked: isUserLocked,
      innovatorName: userName,
    };

    return {
      summary: {
        id: innovation.id,
        name: innovation.name,
        status: innovation.status,
        company: this.getUserOrganisationName(b2cOwnerUser),
        companySize: this.getUserOrganisationSize(b2cOwnerUser),
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
      lockedInnovatorValidation,
    };
  }

  async getInnovationListByState(
    requestUser: RequestUser,
    statuses: string[],
    skip: number,
    take: number,
    order: OrderByClauseType[] = [],
    supportFilter?: SupportFilter
  ): Promise<InnovationListModel> {
    const query = this.repository
      .createQueryBuilder("innovation")
      .distinct()
      .leftJoinAndSelect("innovation.assessments", "assessment")
      .leftJoinAndSelect("assessment.assignTo", "assignTo")
      .leftJoinAndSelect("innovation.innovationSupports", "supports")
      .leftJoinAndSelect("supports.organisationUnit", "unit")
      .leftJoinAndSelect("unit.organisation", "organisation");

    this.buildSupportFilter(requestUser, supportFilter, query);

    query.andWhere(
      "innovation.status in (:...statuses) and innovation.deleted_at IS NULL",
      {
        statuses,
      }
    );

    // get overdue innovations before pagination
    const overdue = await this.getOverdueInnovations(
      requestUser,
      supportFilter,
      statuses
    );

    query.skip(skip);
    query.take(take);

    for (const orderClause of order) {
      query.addOrderBy(orderClause.field, orderClause.direction);
    }

    const result = await query.getManyAndCount();

    const deepUsers = result[0]
      .filter(
        (innovation) =>
          innovation.assessments && innovation.assessments.length > 0
      )
      .map((innovation) => {
        return innovation.assessments.map((a) => a.assignTo.externalId);
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

    const notifications = await this.notificationService.getUnreadNotifications(
      requestUser
    );

    let aggregatedNotifications;
    if (requestUser.type === UserType.ASSESSMENT) {
      aggregatedNotifications = await this.notificationService.getNotificationsGroupedByInnovationStatus(
        requestUser
      );
    } else {
      aggregatedNotifications = await this.notificationService.getNotificationsGroupedBySupportStatus(
        requestUser
      );
    }

    return {
      data: this.mapResponse(res, notifications),
      count: result[1],
      overdue,
      tabInfo: aggregatedNotifications,
    };
  }

  async hasIncompleteSections(sections) {
    const innovationSections = this.getInnovationSectionsMetadata(sections);
    return innovationSections.some(
      (x) => x.status !== InnovationSectionStatus.SUBMITTED
    );
  }

  async submitInnovation(requestUser: RequestUser, id: string) {
    if (!id || !requestUser || !checkIfValidUUID(id)) {
      throw new InvalidParamsError(
        "Invalid parameters. You must define the id and the request user."
      );
    }

    const filterOptions: FindOneOptions = {
      where: { owner: requestUser.id, status: InnovationStatus.CREATED },
      loadRelationIds: true,
    };

    const innovation = await this.findInnovation(
      requestUser,
      id,
      filterOptions
    );
    if (!innovation) {
      throw new InnovationNotFoundError("Innovation not found for the user.");
    }

    const sections = await this.findInnovationSections(innovation.id);

    const canSubmit = !(await this.hasIncompleteSections(sections));

    if (!canSubmit) {
      throw new InvalidSectionStateError(
        "Cannot submit the innovation for assessment with incomplete sections."
      );
    }

    await this.connection.transaction(async (trs) => {
      const updatedInnovation = await trs.update(
        Innovation,
        { id: innovation.id },
        {
          submittedAt: new Date(),
          status: InnovationStatus.WAITING_NEEDS_ASSESSMENT,
          updatedBy: requestUser.id,
        }
      );
      await this.createActivityLog(
        requestUser,
        innovation,
        Activity.INNOVATION_SUBMISSION,
        trs
      );

      return updatedInnovation;
    });

    // await this.repository.update(innovation.id, {
    //   submittedAt: new Date(),
    //   status: InnovationStatus.WAITING_NEEDS_ASSESSMENT,
    //   updatedBy: requestUser.id,
    // });

    try {
      await this.notificationService.create(
        requestUser,
        NotificationAudience.ASSESSMENT_USERS,
        innovation.id,
        NotificationContextType.INNOVATION,

        innovation.id,
        `The innovation ${innovation.name} was submitted for assessment.`
      );
    } catch (error) {
      this.logService.error(
        `An error has occured while creating a notification of type ${NotificationContextType.INNOVATION} from ${requestUser.id}`,
        error
      );
    }

    // send email to Innovator that submited this innovation
    try {
      await this.notificationService.sendEmail(
        requestUser,
        EmailNotificationTemplate.INNOVATORS_NEEDS_ASSESSMENT_SUBMITED,
        innovation.id,
        innovation.id,
        [requestUser.id],
        {
          innovation_name: innovation.name,
        }
      );
    } catch (error) {
      this.logService.error(
        `An error has occured while sending an email with the template ${EmailNotificationTemplate.INNOVATORS_NEEDS_ASSESSMENT_SUBMITED}.`,
        error
      );
    }

    // send email to all Needs Assessment users
    try {
      await this.notificationService.sendEmail(
        requestUser,
        EmailNotificationTemplate.ASSESSMENT_USERS_INNOVATION_SUBMITED,
        innovation.id,
        innovation.id,
        null, // list of recipients determined by the handler
        {
          innovation_name: innovation.name,
        }
      );
    } catch (error) {
      this.logService.error(
        `An error has occured while sending an email with the template ${EmailNotificationTemplate.ASSESSMENT_USERS_INNOVATION_SUBMITED}.`,
        error
      );
    }

    return {
      id: innovation.id,
      status: InnovationStatus.WAITING_NEEDS_ASSESSMENT,
    };
  }

  private async archiveInnovationTransaction(
    transactionManager: EntityManager,
    requestUser: RequestUser,
    innovation: Innovation,
    reason: string,
    supports: any[]
  ) {
    // Update all supports and DECLINE all open actions
    for (let orgSupIdx = 0; orgSupIdx < supports.length; orgSupIdx++) {
      const innovationSupport = supports[orgSupIdx];
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
          {
            status: InnovationActionStatus.DECLINED,
            updatedBy: requestUser.id,
          }
        );
      }
      innovationSupport.status = InnovationSupportStatus.UNASSIGNED;
      innovationSupport.updatedBy = requestUser.id;
      innovationSupport.deletedAt = new Date();
      await transactionManager.save(InnovationSupport, innovationSupport);
    }
    // Update innovation
    innovation.status = InnovationStatus.ARCHIVED;
    innovation.updatedBy = requestUser.id;
    innovation.organisationShares = [];
    innovation.archiveReason = reason;
    innovation.deletedAt = new Date();
    await transactionManager.save(Innovation, innovation);

    return {
      id: innovation.id,
      status: InnovationStatus.ARCHIVED,
    };
  }

  async archiveInnovation(
    requestUser: RequestUser,
    id: string,
    reason: string,
    transactionManager?: EntityManager
  ) {
    if (!id || !requestUser || !checkIfValidUUID(id)) {
      throw new InvalidParamsError("Invalid parameters.");
    }
    const filterOptions = {
      relations: [
        "organisationShares",
        "innovationSupports",
        "innovationSupports.organisationUnitUsers",
        "innovationSupports.organisationUnitUsers.organisationUser",
        "innovationSupports.organisationUnitUsers.organisationUser.user",
      ],
      where: { owner: requestUser.id },
    };
    const innovation = await this.findInnovation(
      requestUser,
      id,
      filterOptions
    );
    if (!innovation) {
      throw new InnovationNotFoundError("Innovation not found for the user.");
    }
    const supports = innovation.innovationSupports;

    const supportUsers = [];
    for (let orgSupIdx = 0; orgSupIdx < supports.length; orgSupIdx++) {
      const organisationUnitUsers = supports[orgSupIdx].organisationUnitUsers;
      if (organisationUnitUsers && organisationUnitUsers.length > 0) {
        for (
          let userIdx = 0;
          userIdx < organisationUnitUsers.length;
          userIdx++
        ) {
          supportUsers.push(
            organisationUnitUsers[userIdx].organisationUser.user.id
          );
        }
      }
    }

    let result;
    if (transactionManager) {
      result = await this.archiveInnovationTransaction(
        transactionManager,
        requestUser,
        innovation,
        reason,
        supports
      );
    } else {
      result = await this.connection.transaction(async (transactionManager) => {
        return this.archiveInnovationTransaction(
          transactionManager,
          requestUser,
          innovation,
          reason,
          supports
        );
      });
    }

    if (supportUsers && supportUsers.length > 0) {
      try {
        await this.notificationService.sendEmail(
          requestUser,
          EmailNotificationTemplate.ACCESSORS_INNOVATION_ARCHIVAL_UPDATE,
          innovation.id,
          innovation.id,
          supportUsers,
          {
            innovation_name: innovation.name,
          }
        );
      } catch (error) {
        this.logService.error(
          `An error has occured while sending an email with the template ${EmailNotificationTemplate.ACCESSORS_INNOVATION_ARCHIVAL_UPDATE}.`,
          error
        );
      }
    }
    return result;
  }

  async getOrganisationUnitShares(
    requestUser: RequestUser,
    innovationId: string
  ) {
    if (!innovationId || !requestUser || !checkIfValidUUID(innovationId)) {
      throw new InvalidParamsError(
        "Invalid parameters. You must define the innovationId and the request user."
      );
    }

    const filterOptions = {
      relations: ["organisationShares", "organisationShares.organisationUnits"],
    };

    const innovation = await this.findInnovation(
      requestUser,
      innovationId,
      filterOptions
    );

    if (!innovation) {
      throw new InnovationNotFoundError("Innovation not found for the user.");
    }

    const organisationShares = innovation.organisationShares;
    const resolvedUnits = [];
    for (const org of organisationShares) {
      const units = await org.organisationUnits;
      resolvedUnits.push(units);
    }

    const unitShares = resolvedUnits.flatMap((r) => r.map((u) => u.id));

    return unitShares;
  }

  async getOrganisationShares(requestUser: RequestUser, innovationId: string) {
    if (!innovationId || !requestUser || !checkIfValidUUID(innovationId)) {
      throw new InvalidParamsError(
        "Invalid parameters. You must define the innovationId and the request user."
      );
    }

    const filterOptions = {
      relations: [
        "organisationShares",
        "innovationSupports",
        "innovationSupports.organisationUnit",
        "innovationSupports.organisationUnit.organisation",
      ],
      where: { owner: requestUser.id },
    };
    const innovation = await this.findInnovation(
      requestUser,
      innovationId,
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
    requestUser: RequestUser,
    innovationId: string,
    organisations: string[]
  ) {
    if (!innovationId || !requestUser.id || !checkIfValidUUID(innovationId)) {
      throw new InvalidParamsError(
        "Invalid parameters. You must define the innovationId and the request user."
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
      where: { owner: requestUser.id },
    };
    const innovation = await this.findInnovation(
      requestUser,
      innovationId,
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
                {
                  status: InnovationActionStatus.DECLINED,
                  updatedBy: requestUser.id,
                }
              );
            }

            innovationSupport.status = InnovationSupportStatus.UNASSIGNED;
            innovationSupport.updatedBy = requestUser.id;
            innovationSupport.deletedAt = new Date();

            await transactionManager.save(InnovationSupport, innovationSupport);
          }
        }
      }

      innovation.updatedBy = requestUser.id;
      innovation.organisationShares = organisations.map((id: string) =>
        Organisation.new({ id })
      );

      const orgs = await this.organisationRepo.findByIds(
        innovation.organisationShares.map((org) => org.id)
      );

      try {
        await this.createActivityLog(
          requestUser,
          innovation,
          Activity.SHARING_PREFERENCES_UPDATE,
          transactionManager,
          {
            organisations: orgs.map((org) => org.name),
          }
        );
      } catch (error) {
        this.logService.error(
          `An error has occured while creating activity log from ${requestUser.id}`,
          error
        );

        throw error;
      }

      return await transactionManager.save(Innovation, innovation);
    });
  }

  private getUserOrganisationName(user: ProfileModel) {
    // BUSINESS RULE. One user only belongs to 1 organisation.
    return user.organisations.length > 0 && !user.organisations[0].isShadow
      ? user.organisations[0].name
      : null;
  }

  private getUserOrganisationSize(user: ProfileModel) {
    // BUSINESS RULE. One user only belongs to 1 organisation.
    return user.organisations.length > 0 && !user.organisations[0].isShadow
      ? user.organisations[0].size
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

  private mapResponse(res: any[], notifications: any[]): InnovationViewModel[] {
    const result: InnovationViewModel[] = res.map((r) => {
      const unread = notifications?.filter((n) => n.contextId === r.id);

      return {
        id: r.id,
        name: r.name,
        submittedAt: r.submittedAt,
        countryName: r.countryName,
        postCode: r.postcode,
        mainCategory: r.mainCategory,
        otherMainCategoryDescription: r.otherMainCategoryDescription,
        assessment: {
          id: r.assessments[0]?.id,
          createdAt: r.assessments[0]?.createdAt,
          assignTo: { name: r.assessments?.user?.name },
          finishedAt: r.assessments[0]?.finishedAt,
        },
        organisations: r.organisations || [],
        notifications: {
          count: unread?.length || 0,
          isNew: r.assessments.length === 0,
        },
      };
    });

    return result;
  }

  private async getOrganisationsMap(
    innovations: Innovation[]
  ): Promise<{ [key: string]: string[] } | []> {
    const innovationIds: string[] = innovations.map((o) => o.id);
    // return await this.supportRepo.findByInnovationIds(innovationIds) || [];
    // FROM THE INNOVATIONS PASSED IN
    // GRAB THE SUPPORTS WITH THE STATUS = ENGAGING

    const supports = await this.supportRepo.find({
      where: {
        innovation: In(innovationIds),
        status: InnovationSupportStatus.ENGAGING,
      },
      relations: [
        "innovation",
        "organisationUnit",
        "organisationUnit.organisation",
      ],
    });

    const supportMap = {};

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
        supportMap[element.innovation.id] = [organisation];
      } else {
        // OTHERWISE PUSH THE ACRONYM INTO THE ARRAY
        // BUT
        // FIRST CHECK IF THE ACRONYM ALREADY EXISTS
        const exists = supportMap[element.innovation.id].find(
          (x) => x === organisation
        );
        if (!exists) supportMap[element.innovation.id].push(organisation);
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

  private getInnovationSectionsMetadata(
    sections: InnovationSection[]
  ): InnovationSectionModel[] {
    const innovationSections: InnovationSectionModel[] = [];

    for (const key in InnovationSectionCatalogue) {
      const section = sections.find((sec) => sec.section === key);
      innovationSections.push(this.getInnovationSectionMetadata(key, section));
    }

    return innovationSections;
  }

  private getInnovationSectionMetadata(
    key: string,
    section?: InnovationSection
  ): InnovationSectionModel {
    let result: InnovationSectionModel;

    if (section) {
      result = {
        id: section.id,
        section: section.section,
        status: section.status,
        updatedAt: section.updatedAt,
        submittedAt: section.submittedAt,
        actionStatus: null,
      };
    } else {
      result = {
        id: null,
        section: InnovationSectionCatalogue[key],
        status: InnovationSectionStatus.NOT_STARTED,
        updatedAt: null,
        submittedAt: null,
        actionStatus: null,
      };
    }

    return result;
  }

  public getConnection() {
    return this.connection;
  }

  private buildSupportFilter(
    requestUser: RequestUser,
    filter: SupportFilter,
    query: SelectQueryBuilder<Innovation>
  ): SelectQueryBuilder<Innovation> {
    switch (filter) {
      case SupportFilter.UNASSIGNED:
        query.andWhere(
          "NOT EXISTS (SELECT 1 FROM innovation_support s where s.innovation_id = innovation.id and deleted_at is null)"
        );
        break;
      case SupportFilter.ENGAGING:
        query.andWhere(
          `EXISTS (SELECT 1 FROM innovation_support s where s.innovation_id = innovation.id and deleted_at is null and s.status = '${InnovationSupportStatus.ENGAGING}')`
        );
        break;
      case SupportFilter.NOT_ENGAGING:
        query.andWhere(
          `EXISTS (SELECT 1 FROM innovation_support s where s.innovation_id = innovation.id and deleted_at is null and s.status NOT IN ('${InnovationSupportStatus.ENGAGING}'))`
        );
        query.andWhere(
          `NOT EXISTS (SELECT 1 FROM innovation_support s where s.innovation_id = innovation.id and deleted_at is null and s.status = '${InnovationSupportStatus.ENGAGING}')`
        );
        break;
      default:
        break;
    }

    return query;
  }

  private async getOverdueInnovations(
    requestUser,
    supportFilter,
    statuses
  ): Promise<number> {
    const query = this.repository
      .createQueryBuilder("innovation")
      .distinct()
      .leftJoinAndSelect("innovation.assessments", "assessment")
      .leftJoinAndSelect("assessment.assignTo", "assignTo")
      .leftJoinAndSelect("innovation.innovationSupports", "supports")
      .leftJoinAndSelect("supports.organisationUnit", "unit")
      .leftJoinAndSelect("unit.organisation", "organisation");

    this.buildSupportFilter(requestUser, supportFilter, query);

    query.andWhere(
      "innovation.status in (:...statuses) and innovation.deleted_at IS NULL",
      {
        statuses,
      }
    );

    query.andWhere(
      `DATEDIFF(day,innovation.submitted_at, getdate()) > 7 AND assessment.finished_at IS NULL`
    );

    return await query.getCount();
  }

  private async createActivityLog(
    requestUser: RequestUser,
    innovation: Innovation,
    activity: Activity,
    transaction: EntityManager,
    customParams?: { [key: string]: any }
  ) {
    return await this.activityLogService.createLog(
      requestUser,
      innovation,
      activity,
      transaction,
      customParams
    );
  }
  async saveSection(
    requestUser: RequestUser,
    innovation: Innovation,
    transaction: EntityManager,
    section: InnovationSectionCatalogue
  ) {
    if (!requestUser || !innovation) {
      throw new InvalidParamsError("Invalid parameters.");
    }
    const innovationSection = InnovationSection.new({
      innovation,
      section: section,
      status: InnovationSectionStatus.DRAFT,
      createdBy: requestUser.id,
      updatedBy: requestUser.id,
    });

    if (transaction) {
      const result = await transaction.save(
        InnovationSection,
        innovationSection
      );
      return result;
    }
  }
}
