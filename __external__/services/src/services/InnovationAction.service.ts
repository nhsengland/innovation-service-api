import {
  AccessorOrganisationRole,
  Comment,
  InnovationAction,
  InnovationActionStatus,
  InnovationSectionAliasCatalogue,
  InnovationSupport,
  NotificationAudience,
  NotificationContextType,
} from "@domain/index";
import {
  InnovationNotFoundError,
  InnovationSupportNotFoundError,
  InvalidDataError,
  InvalidParamsError,
  InvalidUserRoleError,
  MissingUserOrganisationError,
  MissingUserOrganisationUnitError,
  ResourceNotFoundError,
} from "@services/errors";
import { hasAccessorRole } from "@services/helpers";
import { InnovationActionModel } from "@services/models/InnovationActionModel";
import { RequestUser } from "@services/models/RequestUser";
import {
  Connection,
  FindManyOptions,
  getConnection,
  getRepository,
  Repository,
} from "typeorm";
import { InnovationService } from "./Innovation.service";
import { InnovationSectionService } from "./InnovationSection.service";
import { NotificationService } from "./Notification.service";
import { UserService } from "./User.service";

export class InnovationActionService {
  private readonly connection: Connection;
  private readonly actionRepo: Repository<InnovationAction>;
  private readonly innovationService: InnovationService;
  private readonly innovationSectionService: InnovationSectionService;
  private readonly userService: UserService;
  private readonly notificationService: NotificationService;

  constructor(connectionName?: string) {
    this.connection = getConnection(connectionName);
    this.actionRepo = getRepository(InnovationAction, connectionName);
    this.innovationService = new InnovationService(connectionName);
    this.innovationSectionService = new InnovationSectionService(
      connectionName
    );
    this.userService = new UserService(connectionName);
    this.notificationService = new NotificationService(connectionName);
  }

  async create(requestUser: RequestUser, innovationId: string, action: any) {
    if (!requestUser || !action || !innovationId) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    if (!requestUser.organisationUser) {
      throw new MissingUserOrganisationError(
        "Invalid user. User has no organisations."
      );
    }

    if (!requestUser.organisationUnitUser) {
      throw new MissingUserOrganisationUnitError(
        "Invalid user. User has no organisation units."
      );
    }

    const filterOptions = {
      relations: [
        "sections",
        "innovationSupports",
        "innovationSupports.organisationUnit",
      ],
    };
    const innovation = await this.innovationService.findInnovation(
      requestUser,
      innovationId,
      filterOptions
    );
    if (!innovation) {
      throw new InnovationNotFoundError(
        "Invalid parameters. Innovation not found for the user."
      );
    }

    const sections = await innovation.sections;
    let actionsCounter = 0;

    let innovationSection = sections.find(
      (sec) => sec.section === action.section
    );
    if (!innovationSection) {
      innovationSection = await this.innovationSectionService.createSection(
        requestUser,
        innovation.id,
        action.section
      );
    } else {
      const actions = await innovationSection.actions;
      actionsCounter = actions.length;
    }

    const organisationUnit = requestUser.organisationUnitUser.organisationUnit;

    const innovationSupport: InnovationSupport = innovation?.innovationSupports.find(
      (is: InnovationSupport) => is.organisationUnit.id === organisationUnit.id
    );
    if (!innovationSupport) {
      throw new InnovationSupportNotFoundError(
        "Invalid parameters. Innovation Support not found."
      );
    }

    const actionObj = {
      displayId: this.getActionDisplayId(action.section, actionsCounter),
      description: action.description,
      status: InnovationActionStatus.REQUESTED,
      innovationSection: { id: innovationSection.id },
      innovationSupport: { id: innovationSupport.id },
      createdBy: requestUser.id,
      updatedBy: requestUser.id,
    };

    const result = await this.actionRepo.save(actionObj);

    await this.notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovationId,
      NotificationContextType.ACTION,
      result.id,
      `An action was created by the accessor with id ${requestUser.id} for the innovation ${innovation.name}(${innovationId})`
    );

    return result;
  }

  async updateByAccessor(
    requestUser: RequestUser,
    id: string,
    innovationId: string,
    action: any
  ) {
    if (!id || !requestUser || !action) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    if (!requestUser.organisationUser) {
      throw new MissingUserOrganisationError(
        "Invalid user. User has no organisations."
      );
    }

    if (!requestUser.organisationUnitUser) {
      throw new MissingUserOrganisationUnitError(
        "Invalid user. User has no organisation units."
      );
    }

    const organisationUnit = requestUser.organisationUnitUser.organisationUnit;

    const innovation = await this.innovationService.findInnovation(
      requestUser,
      innovationId,
      null
    );
    if (!innovation) {
      throw new InvalidParamsError(
        "Invalid parameters. Innovation not found for the user."
      );
    }

    const innovationAction = await this.findOne(id);
    if (
      !innovationAction ||
      innovationAction.innovationSupport.organisationUnit.id !==
        organisationUnit.id
    ) {
      throw new InvalidDataError("Invalid action data.");
    }

    const result = await this.update(
      requestUser,
      innovationAction,
      innovationId,
      action
    );

    await this.notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovationId,
      NotificationContextType.ACTION,
      result.id,
      `An action was updated by the accessor with id ${requestUser.id} for the innovation ${innovation.name}(${innovationId})`
    );

    return result;
  }

  async updateByInnovator(
    requestUser: RequestUser,
    id: string,
    innovationId: string,
    action: any
  ) {
    if (!requestUser || !id || !action) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const filterOptions = {
      relations: ["innovationSection", "innovationSection.innovation"],
      where: `owner_id = '${requestUser.id}'`,
    };

    const innovationAction = await this.actionRepo.findOne(id, filterOptions);
    if (!innovationAction) {
      throw new ResourceNotFoundError("Invalid parameters.");
    }

    const result = await this.update(
      requestUser,
      innovationAction,
      innovationId,
      action
    );

    await this.notificationService.create(
      requestUser,
      NotificationAudience.ACCESSORS,
      innovationId,
      NotificationContextType.ACTION,
      innovationAction.id,
      `An action was updated by the innovator with id ${requestUser.id} for the innovation with id ${innovationId}`
    );

    return result;
  }

  async find(
    requestUser: RequestUser,
    id: string,
    innovationId: string
  ): Promise<InnovationActionModel> {
    if (!requestUser || !innovationId) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const innovation = await this.innovationService.findInnovation(
      requestUser,
      innovationId,
      null
    );
    if (!innovation) {
      throw new InnovationNotFoundError(
        "Invalid parameters. Innovation not found for the user."
      );
    }

    const innovationAction = await this.findOne(id);
    if (!innovationAction) {
      throw new ResourceNotFoundError(
        "Invalid parameters. Innovation action not found."
      );
    }

    const b2cCreatorUser = await this.userService.getProfile(
      innovationAction.createdBy
    );
    const organisationUnit =
      innovationAction.innovationSupport.organisationUnit;

    return {
      id: innovationAction.id,
      displayId: innovationAction.displayId,
      status: innovationAction.status,
      description: innovationAction.description,
      section: innovationAction.innovationSection.section,
      createdAt: innovationAction.createdAt,
      updatedAt: innovationAction.updatedAt,
      createdBy: {
        id: innovationAction.createdBy,
        name: b2cCreatorUser.displayName,
        organisationName: organisationUnit.organisation.name,
        organisationUnitName: organisationUnit.name,
      },
    };
  }

  async findAllByAccessor(
    requestUser: RequestUser,
    openActions: boolean,
    skip: number,
    take: number,
    order?: { [key: string]: "ASC" | "DESC" }
  ) {
    if (!requestUser) {
      throw new InvalidParamsError("Invalid parameters.");
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

    const query = this.actionRepo
      .createQueryBuilder("innovationAction")
      .innerJoinAndSelect(
        "innovationAction.innovationSection",
        "innovationSection"
      )
      .innerJoinAndSelect("innovationSection.innovation", "innovation")
      .where("InnovationAction.status IN (:...statuses)", {
        statuses: this.getFilterStatusList(openActions),
      })
      .take(take)
      .skip(skip);

    if (order) {
      order["displayId"] &&
        query.orderBy("innovationAction.displayId", order["displayId"]);
      order["section"] &&
        query.orderBy("innovationSection.section", order["section"]);
      order["innovationName"] &&
        query.orderBy("innovation.name", order["innovationName"]);
      order["createdAt"] &&
        query.orderBy("innovationAction.createdAt", order["createdAt"]);
      order["status"] &&
        query.orderBy("innovationAction.status", order["status"]);
    } else {
      query.orderBy("innovationAction.createdAt", "DESC");
    }

    if (
      organisationUser.role === AccessorOrganisationRole.QUALIFYING_ACCESSOR
    ) {
      query
        .innerJoinAndSelect(
          "innovation.organisationShares",
          "organisationShares"
        )
        .andWhere("organisation_id = :organisationId", {
          organisationId: organisationUser.organisation.id,
        });
    } else {
      const organisationUnit =
        requestUser.organisationUnitUser.organisationUnit;

      query
        .innerJoinAndSelect(
          "innovation.innovationSupports",
          "innovationSupports"
        )
        .andWhere("organisation_unit_id = :organisationUnitId", {
          organisationUnitId: organisationUnit.id,
        });
    }

    const [innovationActions, count] = await query.getManyAndCount();

    const actions = innovationActions?.map((ia: InnovationAction) => ({
      id: ia.id,
      displayId: ia.displayId,
      innovation: {
        id: ia.innovationSection.innovation.id,
        name: ia.innovationSection.innovation.name,
      },
      status: ia.status,
      section: ia.innovationSection.section,
      createdAt: ia.createdAt,
      updatedAt: ia.updatedAt,
    }));

    return {
      data: actions,
      count: count,
    };
  }

  async findAllByInnovation(
    requestUser: RequestUser,
    innovationId: string
  ): Promise<InnovationActionModel[]> {
    if (!requestUser || !innovationId) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const innovation = await this.innovationService.findInnovation(
      requestUser,
      innovationId
    );
    if (!innovation) {
      throw new InnovationNotFoundError(
        "Invalid parameters. Innovation not found for the user."
      );
    }

    const filterOptions: FindManyOptions<InnovationAction> = {
      relations: ["innovationSection"],
      where: `innovation_id = '${innovation.id}'`,
    };
    const innovationActions = await this.actionRepo.find(filterOptions);

    return innovationActions.map((ia: InnovationAction) => ({
      id: ia.id,
      displayId: ia.displayId,
      status: ia.status,
      description: ia.description,
      section: ia.innovationSection.section,
      createdAt: ia.createdAt,
      updatedAt: ia.updatedAt,
    }));
  }

  private async update(
    requestUser: RequestUser,
    innovationAction: InnovationAction,
    innovationId: string,
    action: any
  ) {
    return await this.connection.transaction(async (transactionManager) => {
      if (action.comment) {
        const comment = Comment.new({
          user: { id: requestUser.id },
          innovation: { id: innovationId },
          message: action.comment,
          innovationAction: { id: innovationAction.id },
          createdBy: requestUser.id,
          updatedBy: requestUser.id,
          organisationUnit: requestUser.organisationUnitUser
            ? { id: requestUser.organisationUnitUser.organisationUnit.id }
            : null,
        });
        await transactionManager.save(Comment, comment);
      }

      innovationAction.status = action.status;
      innovationAction.updatedBy = requestUser.id;

      return await transactionManager.save(InnovationAction, innovationAction);
    });
  }

  private async findOne(id: string): Promise<InnovationAction> {
    const filterOptions = {
      relations: [
        "innovationSection",
        "innovationSupport",
        "innovationSupport.organisationUnit",
        "innovationSupport.organisationUnit.organisation",
      ],
    };

    return await this.actionRepo.findOne(id, filterOptions);
  }

  private getActionDisplayId(section: string, counter: number) {
    const alias = InnovationSectionAliasCatalogue[section] || "ZZ";
    return alias + (++counter).toString().slice(-2).padStart(2, "0");
  }

  private getFilterStatusList(openActions: boolean) {
    if (openActions) {
      return [
        InnovationActionStatus.IN_REVIEW,
        InnovationActionStatus.REQUESTED,
        InnovationActionStatus.CONTINUE,
        InnovationActionStatus.STARTED,
      ];
    } else {
      return [
        InnovationActionStatus.COMPLETED,
        InnovationActionStatus.DECLINED,
        InnovationActionStatus.DELETED,
      ];
    }
  }
}
