import {
  Innovation,
  InnovationFile,
  InnovationSection,
  InnovationSectionCatalogue,
  InnovationSectionStatus,
  OrganisationUser,
} from "@domain/index";
import * as sectionBodySchema from "@services/config/innovation-section-body.config.json";
import * as sectionResponseSchema from "@services/config/innovation-section-response.config.json";
import { FindOneOptions } from "typeorm";
import { InnovationSectionModel } from "../models/InnovationSectionModel";
import { InnovationSectionResult } from "../models/InnovationSectionResult";
import { BaseService } from "./Base.service";
import { FileService } from "./File.service";
import { InnovationService } from "./Innovation.service";

export class InnovationSectionService extends BaseService<InnovationSection> {
  private readonly fileService: FileService;
  private readonly innovationService: InnovationService;

  constructor(connectionName?: string) {
    super(InnovationSection, connectionName);
    this.fileService = new FileService(connectionName);
    this.innovationService = new InnovationService(connectionName);
  }

  async findAllInnovationSections(
    innovationId: string,
    userId: string,
    userOrganisations?: OrganisationUser[]
  ) {
    if (!innovationId || !userId) {
      throw new Error(
        "Invalid parameters. You must define the innovation id and the userId."
      );
    }

    const filterOptions: FindOneOptions = {
      where: { owner: userId },
    };
    const innovation = await this.innovationService.findInnovation(
      innovationId,
      userId,
      filterOptions,
      userOrganisations
    );

    if (!innovation) {
      throw new Error("Invalid parameters. Innovation not found for the user.");
    }

    const sections = await innovation.sections;
    const innovationSections = this.getInnovationSections(sections);

    const result: InnovationSectionResult = {
      id: innovation.id,
      name: innovation.name,
      status: innovation.status,
      sections: innovationSections,
    };

    return result;
  }

  async findSection(
    innovationId: string,
    userId: string,
    section: string,
    userOrganisations?: OrganisationUser[]
  ) {
    // VALIDATIONS
    if (!innovationId || !section) {
      throw new Error(
        "Invalid parameters. You must define innovation id and section."
      );
    }

    const sectionFields = sectionResponseSchema[section];
    if (!sectionFields) {
      throw new Error("Invalid parameters. Section not found.");
    }

    const filterOptions: FindOneOptions = {
      relations: ["sections", "sections.files", "owner"],
    };
    const innovation = await this.innovationService.findInnovation(
      innovationId,
      userId,
      filterOptions,
      userOrganisations
    );

    if (!innovation) {
      throw new Error("Invalid parameters. Innovation not found.");
    }

    const sections = await innovation.sections;
    const sec = sections.find((sec) => sec.section === section);

    // GET INNOVATION FIELDS
    const data = {
      ...this.getInnovationFilteredObject(
        innovation,
        sectionFields.innovationFields
      ),
    };

    if (sectionFields.files && sec) {
      const files = sec.files?.map((obj: InnovationFile) => ({
        id: obj.id,
        displayFileName: obj.displayFileName,
        url: this.fileService.getDownloadUrl(obj.id, obj.displayFileName),
      }));

      data["files"] = files;
    }

    // GET SPECIFIC TYPES & DEPENDENCIES
    if (sectionFields.innovationTypes) {
      for (let i = 0; i < sectionFields.innovationTypes.length; i++) {
        const type = sectionFields.innovationTypes[i];

        data[type] = await this.getInnovationTypeArray(innovation, type);
      }
    }

    if (sectionFields.innovationDependencies) {
      for (let i = 0; i < sectionFields.innovationDependencies.length; i++) {
        const dependency = sectionFields.innovationDependencies[i];

        data[dependency.type] = await this.getInnovationFilteredDependencyArray(
          innovation,
          dependency
        );

        if (dependency.files) {
          data[dependency.type].forEach(
            (dep: any) =>
              (dep.files = dep.files?.map((obj: InnovationFile) => ({
                id: obj.id,
                displayFileName: obj.displayFileName,
                url: this.fileService.getDownloadUrl(
                  obj.id,
                  obj.displayFileName
                ),
              })))
          );
        }
      }
    }

    return {
      section: this.getInnovationSection(section, sec),
      data,
    };
  }

  async saveSection(
    innovationId: string,
    userId: string,
    section: string,
    data: any
  ) {
    // VALIDATIONS
    if (!innovationId || !userId || !section || !data) {
      throw new Error("Invalid parameters.");
    }

    const sectionFields = sectionBodySchema[section];
    if (!sectionFields) {
      throw new Error("Invalid parameters. Section not found.");
    }

    const filterOptions: FindOneOptions = {
      relations: ["sections", "sections.files", "owner"],
      where: { owner: userId },
    };
    const innovation = await this.innovationService.find(
      innovationId,
      filterOptions
    );
    if (!innovation) {
      throw new Error("Invalid parameters. Innovation not found for the user.");
    }

    // UPDATE INNOVATION FIELDS
    const updatedInnovation = this.getUpdatedInnovationObject(
      userId,
      innovation,
      data,
      sectionFields.innovationFields
    );

    // CHANGE SECTION STATUS
    const sections = await innovation.sections;
    const innovationSectionIdx = sections.findIndex(
      (obj) => obj.section === section
    );

    if (innovationSectionIdx === -1) {
      const innovationSection = InnovationSection.new({
        section,
        innovation,
        status: InnovationSectionStatus.DRAFT,
        createdBy: userId,
        updatedBy: userId,
        files:
          sectionFields.files && data.files
            ? data.files.map((id: string) => ({ id }))
            : [],
      });
      sections.push(innovationSection);
    } else {
      sections[innovationSectionIdx].updatedBy = userId;
      sections[innovationSectionIdx].status = InnovationSectionStatus.DRAFT;

      if (sectionFields.files) {
        const deletedFiles = sections[innovationSectionIdx].files.filter(
          (obj: InnovationFile) => !data.files.includes(obj.id)
        );

        try {
          await this.fileService.deleteFiles(deletedFiles);
        } catch (error) {
          console.error(error);
          throw error;
        }

        sections[
          innovationSectionIdx
        ].files = data.files?.map((id: string) => ({ id }));
      }
    }
    updatedInnovation.sections = sections;

    // MANAGE SPECIFIC TYPES & DEPENDENCIES
    if (sectionFields.innovationTypes) {
      for (let i = 0; i < sectionFields.innovationTypes.length; i++) {
        const type = sectionFields.innovationTypes[i];

        updatedInnovation[type] = await this.getUpdatedInnovationTypeArray(
          innovation,
          userId,
          type,
          data
        );
      }
    }

    if (sectionFields.innovationDependencies) {
      for (let i = 0; i < sectionFields.innovationDependencies.length; i++) {
        const dependency = sectionFields.innovationDependencies[i];

        updatedInnovation[
          dependency.type
        ] = await this.getUpdatedInnovationDependencyArray(
          innovation,
          userId,
          dependency,
          data
        );
      }
    }

    updatedInnovation.updatedBy = userId;

    return this.innovationService.update(innovationId, updatedInnovation);
  }

  async findAll(filter?: any): Promise<InnovationSection[]> {
    return this.repository.find(filter);
  }

  async submitSections(
    innovationId: string,
    userId: string,
    sections: InnovationSectionCatalogue[]
  ) {
    if (!innovationId || !userId || !sections) {
      throw new Error("Invalid parameters.");
    }

    const filterOptions: FindOneOptions = {
      where: { owner: userId },
    };
    const innovation = await this.innovationService.find(
      innovationId,
      filterOptions
    );
    if (!innovation) {
      throw new Error("Invalid parameters. Innovation not found for the user.");
    }

    const innovSections = await innovation.sections;

    sections.forEach((key: InnovationSectionCatalogue) => {
      const secIdx = innovSections.findIndex((obj) => obj.section === key);

      if (secIdx === -1) {
        innovSections.push(
          InnovationSection.new({
            innovation,
            section: InnovationSectionCatalogue[key],
            status: InnovationSectionStatus.SUBMITTED,
            createdBy: userId,
            updatedBy: userId,
            submittedAt: new Date(),
          })
        );
      } else {
        innovSections[secIdx].updatedBy = userId;
        innovSections[secIdx].status = InnovationSectionStatus.SUBMITTED;
        innovSections[secIdx].submittedAt = new Date();
      }
    });

    return await this.repository.save(innovSections);
  }

  async createSection(
    innovationId: string,
    userId: string,
    section: InnovationSectionCatalogue,
    status?: InnovationSectionStatus
  ) {
    const innovationSection = InnovationSection.new({
      innovation: { id: innovationId },
      section,
      status: status || InnovationSectionStatus.NOT_STARTED,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.create(innovationSection);
  }

  private getInnovationSections(
    sections: InnovationSection[]
  ): InnovationSectionModel[] {
    const innovationSections: InnovationSectionModel[] = [];

    for (const key in InnovationSectionCatalogue) {
      const section = sections.find((sec) => sec.section === key);
      innovationSections.push(this.getInnovationSection(key, section));
    }

    return innovationSections;
  }

  private getInnovationSection(
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

  private async getUpdatedInnovationTypeArray(
    innovation: Innovation,
    userId: string,
    type: string,
    data: any[]
  ) {
    const original: any[] = await innovation[type];

    const newValues: string[] = data[type];
    original
      .filter((obj) => !newValues.some((code: any) => code === obj.type))
      .forEach((_, idx) => {
        original[idx].deletedAt = new Date();
      });

    newValues?.forEach((code: any) => {
      const objectIndex = original.findIndex((e: any) => e.type === code);
      if (objectIndex === -1) {
        original.push({
          type: code,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          deletedAt: null,
        });
      }
    });

    return original;
  }

  private async getUpdatedInnovationDependencyArray(
    innovation: Innovation,
    userId: string,
    dependency: any,
    data: any[]
  ) {
    const original: any[] = await innovation[dependency.type];

    const newValues: any = data[dependency.type];
    const filter: string[] = dependency.fields;

    original
      .filter((obj) => !newValues.some((e: any) => e.id === obj.id))
      .forEach((obj) => {
        obj.deletedAt = new Date();
      });

    newValues.forEach((obj: any) => {
      let newObject: any;
      let files: any[];

      if (dependency.files && obj["files"]) {
        files = obj["files"].map((id: string) => ({ id }));
      }

      if (obj.id) {
        const objectIndex = original.findIndex((e: any) => e.id === obj.id);

        if (objectIndex === -1) {
          throw new Error("Invalid object id");
        }

        newObject = this.getUpdatedInnovationObject(
          userId,
          original[objectIndex],
          obj,
          filter
        );
        if (files) newObject.files = files;
        original[objectIndex] = newObject;
      } else {
        newObject = this.getInnovationFilteredObject(obj, filter);
        newObject.createdBy = userId;
        newObject.updatedBy = userId;
        if (files) newObject.files = files;
        original.push(newObject);
      }
    });

    return original;
  }

  private getUpdatedInnovationObject(
    userId: string,
    original: any,
    data: any,
    filter: any[]
  ) {
    const newObject = original;

    filter.forEach((key) => {
      if (data[key] !== undefined) {
        newObject[key] = data[key];
      }
    });
    newObject.updatedBy = userId;

    return newObject;
  }

  private async getInnovationTypeArray(innovation: Innovation, type: string) {
    const original = await innovation[type];

    return original.flatMap((obj: any) => obj.type);
  }

  private async getInnovationFilteredDependencyArray(
    innovation: Innovation,
    dependency: any
  ) {
    const original = await innovation[dependency.type];

    return original.map((obj: any) =>
      this.getInnovationFilteredObject(obj, dependency.fields)
    );
  }

  private getInnovationFilteredObject(original: any, filter: any[]) {
    return Object.keys(original)
      .filter((key) => filter.includes(key))
      .reduce((obj, key) => {
        obj[key] = original[key];
        return obj;
      }, {});
  }
}
