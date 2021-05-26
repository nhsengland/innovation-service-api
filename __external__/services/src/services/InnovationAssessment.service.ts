import {
  Innovation,
  InnovationAssessment,
  InnovationStatus,
  Organisation,
} from "@domain/index";
import { Connection, getConnection, getRepository, Repository } from "typeorm";
import { InnovationAssessmentResult } from "../models/InnovationAssessmentResult";
import { UserService } from "./User.service";

export class InnovationAssessmentService {
  private readonly connection: Connection;
  private readonly assessmentRepo: Repository<InnovationAssessment>;
  private readonly userService: UserService;

  constructor(connectionName?: string) {
    this.connection = getConnection(connectionName);
    this.assessmentRepo = getRepository(InnovationAssessment, connectionName);
    this.userService = new UserService(connectionName);
  }

  async find(
    id: string,
    innovationId: string
  ): Promise<InnovationAssessmentResult> {
    if (!id) {
      throw new Error("Invalid parameters. You must define id.");
    }

    const assessment = await this.findOne(id, innovationId);
    if (!assessment) {
      return null;
    }

    const b2cUser = await this.userService.getProfile(assessment.assignTo);

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
      innovation: assessment.innovation,
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

  async create(userId: string, innovationId: string, assessment: any) {
    if (!userId || !assessment) {
      throw new Error("Invalid parameters.");
    }

    return await this.connection.transaction(async (transactionManager) => {
      await transactionManager.update(
        Innovation,
        { id: innovationId },
        { status: InnovationStatus.NEEDS_ASSESSMENT }
      );

      assessment.createdBy = userId;
      assessment.updatedBy = userId;

      return await transactionManager.save(InnovationAssessment, assessment);
    });
  }

  async update(
    id: string,
    userId: string,
    innovationId: string,
    assessment: any
  ) {
    if (!id || !userId || !assessment) {
      throw new Error("Invalid parameters.");
    }

    const assessmentDb = await this.findOne(id, innovationId);
    if (!assessmentDb) {
      throw new Error("Assessment not found!");
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
      loadRelationIds: true,
      relations: ["organisations"],
    };

    return await this.assessmentRepo.findOne(id, filterOptions);
  }
}
