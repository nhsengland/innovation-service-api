import {
  Comment,
  Innovation,
  InnovationAssessment,
  InnovationStatus,
  NotificationAudience,
  NotificationContextType,
  UserType,
} from "@domain/index";
import {
  InnovationNotFoundError,
  InvalidParamsError,
  ResourceNotFoundError,
} from "@services/errors";
import { OrganisationModel } from "@services/models/OrganisationModel";
import { RequestUser } from "@services/models/RequestUser";
import { Connection, getConnection, getRepository, Repository } from "typeorm";
import { InnovationAssessmentResult } from "../models/InnovationAssessmentResult";
import { InnovationService } from "./Innovation.service";
import { NotificationService } from "./Notification.service";
import { UserService } from "./User.service";
import { LoggerService } from "./Logger.service";

export class InnovationAssessmentService {
  private readonly connection: Connection;
  private readonly assessmentRepo: Repository<InnovationAssessment>;
  private readonly userService: UserService;
  private readonly innovationService: InnovationService;
  private readonly notificationService: NotificationService;
  private readonly logService: LoggerService;

  constructor(connectionName?: string) {
    this.connection = getConnection(connectionName);
    this.assessmentRepo = getRepository(InnovationAssessment, connectionName);
    this.userService = new UserService(connectionName);
    this.innovationService = new InnovationService(connectionName);
    this.notificationService = new NotificationService(connectionName);
    this.logService = new LoggerService();
  }

  async find(
    requestUser: RequestUser,
    id: string,
    innovationId: string
  ): Promise<InnovationAssessmentResult> {
    if (!requestUser || !id || !innovationId) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    if (requestUser.type !== UserType.ASSESSMENT) {
      const innovation = await this.innovationService.findInnovation(
        requestUser,
        innovationId
      );

      if (!innovation) {
        throw new InnovationNotFoundError("Innovation not found for the user.");
      }
    }

    const assessment = await this.findOne(id, innovationId);
    if (!assessment) {
      throw new ResourceNotFoundError("Assessment not found!");
    }

    const b2cUsers = await this.userService.getListOfUsers([
      assessment.assignTo.id,
      assessment.createdBy,
      assessment.updatedBy,
    ]);
    const b2cUserNames = b2cUsers.reduce((map, obj) => {
      map[obj.id] = obj.displayName;
      return map;
    }, {});

    const organisations = [];
    if (assessment.organisationUnits.length > 0) {
      const uniqueOrganisations = [
        ...new Set(
          assessment.organisationUnits.map((item) => item.organisation.id)
        ),
      ];

      for (let idx = 0; idx < uniqueOrganisations.length; idx++) {
        const units = assessment.organisationUnits.filter(
          (unit) => unit.organisation.id === uniqueOrganisations[idx]
        );

        const organisation: OrganisationModel = {
          id: units[0].organisation.id,
          name: units[0].organisation.name,
          acronym: units[0].organisation.acronym,
          organisationUnits: units.map((unit) => ({
            id: unit.id,
            name: unit.name,
            acronym: unit.acronym,
          })),
        };

        organisations.push(organisation);
      }
    }

    return {
      id: assessment.id,
      description: assessment.description,
      assignToName: b2cUserNames[assessment.assignTo.id],
      createdBy: b2cUserNames[assessment.createdBy],
      createdAt: assessment.createdAt,
      updatedBy: b2cUserNames[assessment.updatedBy],
      updatedAt: assessment.updatedAt,
      innovation: {
        id: assessment.innovation.id,
        name: assessment.innovation.name,
      },
      summary: assessment.summary,
      finishedAt: assessment.finishedAt,
      maturityLevel: assessment.maturityLevel,
      hasRegulatoryApprovals: assessment.hasRegulatoryApprovals,
      hasRegulatoryApprovalsComment: assessment.hasRegulatoryApprovalsComment,
      hasEvidence: assessment.hasEvidence,
      hasEvidenceComment: assessment.hasEvidenceComment,
      hasValidation: assessment.hasValidation,
      hasValidationComment: assessment.hasValidationComment,
      hasProposition: assessment.hasProposition,
      hasPropositionComment: assessment.hasPropositionComment,
      hasCompetitionKnowledge: assessment.hasCompetitionKnowledge,
      hasCompetitionKnowledgeComment: assessment.hasCompetitionKnowledgeComment,
      hasImplementationPlan: assessment.hasImplementationPlan,
      hasImplementationPlanComment: assessment.hasImplementationPlanComment,
      hasScaleResource: assessment.hasScaleResource,
      hasScaleResourceComment: assessment.hasScaleResourceComment,
      organisations,
    };
  }

  async create(
    requestUser: RequestUser,
    innovationId: string,
    assessment: any
  ) {
    if (!requestUser || !assessment) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    return await this.connection.transaction(async (transactionManager) => {
      if (assessment.comment) {
        const comment = Comment.new({
          user: { id: requestUser.id },
          innovation: { id: innovationId },
          message: assessment.comment,
          createdBy: requestUser.id,
          updatedBy: requestUser.id,
        });
        await transactionManager.save(Comment, comment);
      }

      await transactionManager.update(
        Innovation,
        { id: innovationId },
        { status: InnovationStatus.NEEDS_ASSESSMENT }
      );

      const assessmentObj = InnovationAssessment.new({
        description: assessment.description,
        innovation: { id: innovationId },
        assignTo: requestUser.id,
        createdBy: requestUser.id,
        updatedBy: requestUser.id,
      });

      return await transactionManager.save(InnovationAssessment, assessmentObj);
    });
  }

  async update(
    requestUser: RequestUser,
    id: string,
    innovationId: string,
    assessment: any
  ) {
    if (!id || !requestUser || !assessment) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const assessmentDb = await this.findOne(id, innovationId);
    if (!assessmentDb) {
      throw new ResourceNotFoundError("Assessment not found!");
    }

    const result = await this.connection.transaction(
      async (transactionManager) => {
        if (assessment.isSubmission) {
          assessmentDb.finishedAt = new Date();

          await transactionManager.update(
            Innovation,
            { id: innovationId },
            { status: InnovationStatus.IN_PROGRESS, updatedBy: requestUser.id }
          );
        }

        delete assessment["innovation"];
        for (const key in assessmentDb) {
          if (key in assessment) {
            assessmentDb[key] = assessment[key];
          }
        }
        assessmentDb.updatedBy = requestUser.id;
        assessmentDb.organisationUnits = assessment.organisationUnits?.map(
          (id: string) => ({ id })
        );

        return await transactionManager.save(assessmentDb);
      }
    );

    if (assessment.isSubmission) {
      try {
        await this.notificationService.create(
          requestUser,
          NotificationAudience.QUALIFYING_ACCESSORS,
          innovationId,
          NotificationContextType.INNOVATION,
          innovationId,
          `Innovation with id ${innovationId} is now available for Qualifying Accessors`
        );
      } catch (error) {
        this.logService.error(
          `An error has occured while creating a notification of type ${NotificationContextType.INNOVATION} from ${requestUser.id}`,
          error
        );
      }
    }

    return result;
  }

  private async findOne(
    id: string,
    innovationId: string
  ): Promise<InnovationAssessment> {
    const filterOptions = {
      where: { innovation: innovationId },
      relations: [
        "organisationUnits",
        "organisationUnits.organisation",
        "innovation",
        "assignTo",
      ],
    };

    return await this.assessmentRepo.findOne(id, filterOptions);
  }
}
