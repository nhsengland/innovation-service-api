import { InnovationAssessment, Organisation } from "@domain/index";
import { getConnection, getRepository, Repository } from "typeorm";
import { InnovationAssessmentResult } from "../models/InnovationAssessmentResult";

export class InnovationAssessmentService {
  private readonly assessmentRepo: Repository<InnovationAssessment>;

  constructor(connectionName?: string) {
    getConnection(connectionName);
    this.assessmentRepo = getRepository(InnovationAssessment, connectionName);
  }

  async find(id: string): Promise<InnovationAssessmentResult> {
    if (!id) {
      throw new Error("Invalid parameters. You must define id.");
    }

    const assessment = await this.findOne(id);
    if (!assessment) {
      return null;
    }

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

      assignTo: assessment.assignTo,
      innovation: assessment.innovation,
      organisations,
    };
  }

  async create(innovationId: string, userId: string, assessment: any) {
    if (!innovationId || !userId || !assessment) {
      throw new Error("Invalid parameters.");
    }

    assessment.innovation = { id: innovationId };
    assessment.assignTo = { id: userId };
    assessment.createdBy = userId;
    assessment.updatedBy = userId;

    return await this.assessmentRepo.save(assessment);
  }

  private async findOne(id: string): Promise<InnovationAssessment> {
    const filterOptions = {
      relations: ["organisations"],
    };

    return await this.assessmentRepo.findOne(id, filterOptions);
  }
}
