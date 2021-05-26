import { InnovationAssessment, Organisation } from "@domain/index";
import { getConnection, getRepository, Repository } from "typeorm";
import { InnovationAssessmentResult } from "../models/InnovationAssessmentResult";
import { UserService } from "./User.service";

export class InnovationAssessmentService {
  private readonly assessmentRepo: Repository<InnovationAssessment>;
  private readonly userService: UserService;

  constructor(connectionName?: string) {
    getConnection(connectionName);
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

  async create(userId: string, assessment: any) {
    if (!userId || !assessment) {
      throw new Error("Invalid parameters.");
    }

    assessment.createdBy = userId;
    assessment.updatedBy = userId;

    return await this.assessmentRepo.save(assessment);
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
