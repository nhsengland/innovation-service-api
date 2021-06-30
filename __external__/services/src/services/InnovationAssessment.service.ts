import {
  Comment,
  Innovation,
  InnovationAssessment,
  InnovationStatus,
  Organisation,
  OrganisationUser,
} from "@domain/index";
import {
  InnovationNotFoundError,
  InvalidParamsError,
  ResourceNotFoundError,
} from "@services/errors";
import { Connection, getConnection, getRepository, Repository } from "typeorm";
import { InnovationAssessmentResult } from "../models/InnovationAssessmentResult";
import { InnovationService } from "./Innovation.service";
import { UserService } from "./User.service";

export class InnovationAssessmentService {
  private readonly connection: Connection;
  private readonly assessmentRepo: Repository<InnovationAssessment>;
  private readonly userService: UserService;
  private readonly innovationService: InnovationService;

  constructor(connectionName?: string) {
    this.connection = getConnection(connectionName);
    this.assessmentRepo = getRepository(InnovationAssessment, connectionName);
    this.userService = new UserService(connectionName);
    this.innovationService = new InnovationService(connectionName);
  }

  async find(
    id: string,
    innovationId: string
  ): Promise<InnovationAssessmentResult> {
    if (!id || !innovationId) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const assessment = await this.findOne(id, innovationId);
    if (!assessment) {
      throw new ResourceNotFoundError("Assessment not found!");
    }

    const b2cUser = await this.userService.getProfile(assessment.assignTo.id);

    const organisations = assessment.organisations?.map(
      (obj: Organisation) => ({
        id: obj.id,
        name: obj.name,
        acronym: obj.acronym,
      })
    );

    return {
      id: assessment.id,
      description: assessment.description,
      assignToName: b2cUser.displayName,
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

  async findByUser(
    id: string,
    userId: string,
    innovationId: string,
    userOrganisations?: OrganisationUser[]
  ): Promise<InnovationAssessmentResult> {
    if (!id || !userId || !innovationId) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const innovation = await this.innovationService.findInnovation(
      innovationId,
      userId,
      null,
      userOrganisations
    );

    if (!innovation) {
      throw new InnovationNotFoundError("Innovation not found for the user.");
    }

    return await this.find(id, innovationId);
  }

  async create(userId: string, innovationId: string, assessment: any) {
    if (!userId || !assessment) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    return await this.connection.transaction(async (transactionManager) => {
      if (assessment.comment) {
        const comment = Comment.new({
          user: { id: userId },
          innovation: { id: innovationId },
          message: assessment.comment,
          createdBy: userId,
          updatedBy: userId,
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
        assignTo: userId,
        createdBy: userId,
        updatedBy: userId,
      });

      return await transactionManager.save(InnovationAssessment, assessmentObj);
    });
  }

  async update(
    id: string,
    userId: string,
    innovationId: string,
    assessment: any
  ) {
    if (!id || !userId || !assessment) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const assessmentDb = await this.findOne(id, innovationId);
    if (!assessmentDb) {
      throw new ResourceNotFoundError("Assessment not found!");
    }

    return await this.connection.transaction(async (transactionManager) => {
      if (assessment.isSubmission) {
        assessmentDb.finishedAt = new Date();

        await transactionManager.update(
          Innovation,
          { id: innovationId },
          { status: InnovationStatus.IN_PROGRESS, updatedBy: userId }
        );
      }

      delete assessment["innovation"];
      for (const key in assessmentDb) {
        if (key in assessment) {
          assessmentDb[key] = assessment[key];
        }
      }
      assessmentDb.updatedBy = userId;
      assessmentDb.organisations = assessment.organisations?.map(
        (id: string) => ({ id })
      );

      return await transactionManager.save(assessmentDb);
    });
  }

  private async findOne(
    id: string,
    innovationId: string
  ): Promise<InnovationAssessment> {
    const filterOptions = {
      where: { innovation: innovationId },
      relations: ["organisations", "innovation", "assignTo"],
    };

    return await this.assessmentRepo.findOne(id, filterOptions);
  }
}
