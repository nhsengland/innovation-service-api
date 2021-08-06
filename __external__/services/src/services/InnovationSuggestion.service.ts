import { InnovationSupportLogType } from "@domain/index";
import { InnovationNotFoundError, InvalidParamsError } from "@services/errors";
import { InnovationSuggestionModel } from "@services/models/InnovationSuggestionModel";
import { RequestUser } from "@services/models/RequestUser";
import { getConnection } from "typeorm";
import {
  checkIfValidUUID,
  getOrganisationsFromOrganisationUnitsObj,
} from "../helpers";
import { InnovationService } from "./Innovation.service";
import { InnovationAssessmentService } from "./InnovationAssessment.service";
import { InnovationSupportLogService } from "./InnovationSupportLog.service";

export class InnovationSuggestionService {
  private readonly innovationService: InnovationService;
  private readonly innovationAssessmentService: InnovationAssessmentService;
  private readonly innovationSupportLogService: InnovationSupportLogService;

  constructor(connectionName?: string) {
    getConnection(connectionName);
    this.innovationService = new InnovationService(connectionName);
    this.innovationAssessmentService = new InnovationAssessmentService(
      connectionName
    );
    this.innovationSupportLogService = new InnovationSupportLogService(
      connectionName
    );
  }

  async findAllByInnovation(requestUser: RequestUser, innovationId: string) {
    if (!requestUser || !innovationId || !checkIfValidUUID(innovationId)) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const innovation = await this.innovationService.findInnovation(
      requestUser,
      innovationId
    );
    if (!innovation) {
      throw new InnovationNotFoundError("Innovation not found for the user.");
    }

    const innovationSupportLogs = await this.innovationSupportLogService.findMany(
      innovationId,
      InnovationSupportLogType.ACCESSOR_SUGGESTION
    );
    const innovationAssessment = await this.innovationAssessmentService.findOne(
      null,
      innovationId
    );

    const result: InnovationSuggestionModel = {
      assessment: {},
      accessors: [],
    };

    if (innovationAssessment) {
      result.assessment = {
        id: innovationAssessment.id,
        suggestedOrganisations:
          innovationAssessment.organisationUnits.length > 0
            ? getOrganisationsFromOrganisationUnitsObj(
                innovationAssessment.organisationUnits
              )
            : [],
      };
    }

    if (innovationSupportLogs && innovationSupportLogs.length > 0) {
      result.accessors = innovationSupportLogs.map((log) => ({
        organisationUnit: {
          id: log.organisationUnit.id,
          name: log.organisationUnit.name,
          acronym: log.organisationUnit.acronym || "",
          organisation: {
            id: log.organisationUnit.organisation.id,
            name: log.organisationUnit.organisation.name,
            acronym: log.organisationUnit.organisation.acronym || "",
          },
        },
        suggestedOrganisations:
          log.suggestedOrganisationUnits.length > 0
            ? getOrganisationsFromOrganisationUnitsObj(
                log.suggestedOrganisationUnits
              )
            : [],
      }));
    }

    return result;
  }
}
