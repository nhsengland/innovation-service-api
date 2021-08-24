import {
  InnovationEvidence,
  InnovationFile,
  InnovationSectionCatalogue,
  InnovationSectionStatus,
} from "@domain/index";
import {
  InvalidParamsError,
  ResourceNotFoundError,
  SectionNotFoundError,
} from "@services/errors";
import { checkIfValidUUID } from "@services/helpers";
import { RequestUser } from "@services/models/RequestUser";
import { getConnection, getRepository, Repository } from "typeorm";
import { FileService } from "./File.service";
import { InnovationSectionService } from "./InnovationSection.service";

export class InnovationEvidenceService {
  private readonly evidenceRepo: Repository<InnovationEvidence>;
  private readonly fileService: FileService;
  private readonly sectionService: InnovationSectionService;

  constructor(connectionName?: string) {
    getConnection(connectionName);
    this.evidenceRepo = getRepository(InnovationEvidence, connectionName);
    this.fileService = new FileService(connectionName);
    this.sectionService = new InnovationSectionService(connectionName);
  }

  async find(id: string) {
    if (!id || !checkIfValidUUID(id)) {
      throw new InvalidParamsError("Invalid parameters. You must define id.");
    }

    const evidence = await this.findOne(id);
    if (!evidence) {
      throw new ResourceNotFoundError("Evidence not found.");
    }

    const files = evidence.files?.map((obj: InnovationFile) => ({
      id: obj.id,
      displayFileName: obj.displayFileName,
      url: this.fileService.getDownloadUrl(obj.id, obj.displayFileName),
    }));

    return {
      id: evidence.id,
      innovation: evidence.innovation,
      evidenceType: evidence.evidenceType,
      summary: evidence.summary,
      description: evidence.description,
      clinicalEvidenceType: evidence.clinicalEvidenceType,
      files,
    };
  }

  async create(
    requestUser: RequestUser,
    evidence: any,
    section: InnovationSectionCatalogue
  ) {
    if (!evidence || !section) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    await this.updateSectionStatus(evidence.innovation, section);

    evidence.files = evidence.files?.map((id: string) => ({ id }));
    evidence.createdBy = requestUser.id;
    evidence.updatedBy = requestUser.id;

    return await this.evidenceRepo.save(evidence);
  }

  async update(
    requestUser: RequestUser,
    id: string,
    evidence: any,
    section: InnovationSectionCatalogue
  ) {
    if (!id || !evidence || !section) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const evidenceDb = await this.findOne(id);
    if (!evidenceDb) {
      throw new ResourceNotFoundError("Evidence not found!");
    }

    const deletedFiles = evidenceDb.files.filter(
      (obj: InnovationFile) => !evidence.files.includes(obj.id)
    );
    try {
      await this.fileService.deleteFiles(deletedFiles);
    } catch (error) {
      throw error;
    }

    evidence.files = evidence.files.map((id: string) => ({ id }));
    evidence.updatedBy = requestUser.id;

    return await this.evidenceRepo.save(evidence);
  }

  async delete(requestUser: RequestUser, id: string) {
    if (!id || !requestUser) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const evidence = await this.findOne(id);
    if (!evidence) {
      throw new ResourceNotFoundError("Evidence not found!");
    }

    try {
      await this.fileService.deleteFiles(evidence.files);
    } catch (error) {
      throw error;
    }

    evidence.updatedBy = requestUser.id;
    return await this.evidenceRepo.softDelete({ id: evidence.id });
  }

  private async findOne(id: string): Promise<InnovationEvidence> {
    const filterOptions = {
      relations: ["files", "innovation", "innovation.owner"],
    };

    return await this.evidenceRepo.findOne(id, filterOptions);
  }

  private async updateSectionStatus(innovationId: string, section: string) {
    const sectionOptions = {
      where: {
        innovation: innovationId,
        section: section,
      },
    };

    const innovationSections = await this.sectionService.findAll(
      sectionOptions
    );

    if (innovationSections.length === 0) {
      throw new SectionNotFoundError("Invalid section name.");
    }

    const innovationSection = innovationSections[0];
    innovationSection.status = InnovationSectionStatus.DRAFT;

    await this.sectionService.update(innovationSection.id, innovationSection);
  }
}
