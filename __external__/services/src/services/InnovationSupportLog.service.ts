import {
  Innovation,
  InnovationSupportLog,
  InnovationSupportStatus,
} from "@domain/index";
import {
  InnovationNotFoundError,
  InvalidParamsError,
  MissingUserOrganisationError,
  MissingUserOrganisationUnitError,
} from "@services/errors";
import { InnovationSupportLogModel } from "@services/models/InnovationSupportLogModel";
import { RequestUser } from "@services/models/RequestUser";
import { getConnection, getRepository, Repository } from "typeorm";
import { InnovationService } from "./Innovation.service";
import { UserService } from "./User.service";

export class InnovationSupportLogService {
  private readonly supportLogRepo: Repository<InnovationSupportLog>;
  private readonly innovationService: InnovationService;
  private readonly userService: UserService;

  constructor(connectionName?: string) {
    getConnection(connectionName);
    this.supportLogRepo = getRepository(InnovationSupportLog, connectionName);
    this.innovationService = new InnovationService(connectionName);
    this.userService = new UserService(connectionName);
  }

  async create(
    requestUser: RequestUser,
    innovationId: string,
    supportLog: any,
    innovation?: Innovation
  ) {
    if (!requestUser || !innovationId || !supportLog) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    if (!supportLog.type) {
      throw new InvalidParamsError("Invalid parameters. Missing type.");
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

    if (!innovation) {
      const filterOptions = {
        relations: [
          "innovationSupports",
          "innovationSupports.organisationUnit",
        ],
      };

      innovation = await this.innovationService.findInnovation(
        requestUser,
        innovationId,
        filterOptions
      );
      if (!innovation) {
        throw new InnovationNotFoundError(
          "Invalid parameters. Innovation not found for the user."
        );
      }
    }

    const organisationUnitId =
      requestUser.organisationUnitUser.organisationUnit.id;

    let innovationSupportStatus: InnovationSupportStatus;
    if (supportLog.innovationSupportStatus) {
      innovationSupportStatus = supportLog.innovationSupportStatus;
    } else {
      const innovationSupport = innovation.innovationSupports.find(
        (sup) => sup.organisationUnit.id === organisationUnitId
      );

      innovationSupportStatus =
        innovationSupport.status || InnovationSupportStatus.UNASSIGNED;
    }

    const supportLogObj = InnovationSupportLog.new({
      innovation: { id: innovationId },
      organisationUnit: { id: organisationUnitId },
      innovationSupportStatus,
      description: supportLog.description,
      type: supportLog.type,
      suggestedOrganisationUnits: supportLog?.organisationUnits?.map(
        (id: string) => ({
          id,
        })
      ),
      createdBy: requestUser.id,
      updatedBy: requestUser.id,
    });

    return await this.supportLogRepo.save(supportLogObj);
  }

  async findAllByInnovation(requestUser: RequestUser, innovationId: string) {
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

    const innovationLogs = await this.supportLogRepo
      .createQueryBuilder("innovationSupportLog")
      .leftJoinAndSelect(
        "innovationSupportLog.organisationUnit",
        "organisationUnit"
      )
      .leftJoinAndSelect("organisationUnit.organisation", "organisation")
      .leftJoinAndSelect(
        "innovationSupportLog.suggestedOrganisationUnits",
        "suggestedOrganisationUnits"
      )
      .leftJoinAndSelect(
        "suggestedOrganisationUnits.organisation",
        "suggestedOrganisation"
      )
      .where("innovation_id = :innovationId", {
        innovationId: innovationId,
      })
      .getMany();

    const userIds = innovationLogs.map(
      (sup: InnovationSupportLog) => sup.createdBy
    );
    const b2cUsers = await this.userService.getListOfUsers(userIds);
    const b2cUserNames = b2cUsers.reduce((map, obj) => {
      map[obj.id] = obj.displayName;
      return map;
    }, {});

    const response: InnovationSupportLogModel[] = innovationLogs.map((log) => {
      const rec: InnovationSupportLogModel = {
        id: log.id,
        type: log.type,
        description: log.description,
        innovationSupportStatus: log.innovationSupportStatus,
        createdBy: b2cUserNames[log.createdBy],
      };

      if (log.organisationUnit) {
        rec.organisationUnit = {
          id: log.organisationUnit.id,
          name: log.organisationUnit.name,
          acronym: log.organisationUnit.acronym || "",
          organisation: {
            id: log.organisationUnit.organisation.id,
            name: log.organisationUnit.organisation.name,
            acronym: log.organisationUnit.organisation.acronym || "",
          },
        };
      }

      if (
        log.suggestedOrganisationUnits &&
        log.suggestedOrganisationUnits.length > 0
      ) {
        rec.suggestedOrganisationUnits = log.suggestedOrganisationUnits.map(
          (orgUnit) => ({
            id: orgUnit.id,
            name: orgUnit.name,
            acronym: orgUnit.acronym,
            organisation: {
              id: orgUnit.organisation.id,
              name: orgUnit.organisation.name,
              acronym: orgUnit.organisation.acronym,
            },
          })
        );
      }

      return rec;
    });

    return response;
  }
}
