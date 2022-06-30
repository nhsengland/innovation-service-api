import { Activity } from "@domain/enums/activity.enums";
import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import {
  NotifContextDetail,
  NotifContextType,
} from "@domain/enums/notification.enums";
import {
  Innovation,
  InnovationAction,
  InnovationActionStatus,
  InnovationFile,
  InnovationSection,
  InnovationSectionCatalogue,
  InnovationSectionStatus,
  InnovationStatus,
  NotificationAudience,
  NotificationContextType,
  UserType,
} from "@domain/index";
import * as sectionBodySchema from "@services/config/innovation-section-body.config.json";
import * as sectionResponseSchema from "@services/config/innovation-section-response.config.json";
import {
  InnovationNotFoundError,
  InvalidDataError,
  InvalidParamsError,
  SectionNotFoundError,
} from "@services/errors";
import { checkIfValidUUID } from "@services/helpers";
import { RequestUser } from "@services/models/RequestUser";
import { Connection, FindOneOptions, getConnection } from "typeorm";
import { InnovationSectionModel } from "../models/InnovationSectionModel";
import { InnovationSectionResult } from "../models/InnovationSectionResult";
import { ActivityLogService } from "./ActivityLog.service";
import { BaseService } from "./Base.service";
import { FileService } from "./File.service";
import { InnovationService } from "./Innovation.service";
import { LoggerService } from "./Logger.service";
import { NotificationService } from "./Notification.service";

export class InnovationSectionService extends BaseService<InnovationSection> {
  private readonly connection: Connection;
  private readonly fileService: FileService;
  private readonly innovationService: InnovationService;
  private readonly notificationService: NotificationService;
  private readonly logService: LoggerService;
  private readonly activityLogService: ActivityLogService;

  constructor(connectionName?: string) {
    super(InnovationSection, connectionName);
    this.connection = getConnection(connectionName);
    this.fileService = new FileService(connectionName);
    this.innovationService = new InnovationService(connectionName);
    this.notificationService = new NotificationService(connectionName);
    this.logService = new LoggerService();
    this.activityLogService = new ActivityLogService(connectionName);
  }

  async findAllInnovationSectionsMetadata(
    requestUser: RequestUser,
    innovationId: string
  ) {
    if (!innovationId || !requestUser || !checkIfValidUUID(innovationId)) {
      throw new InvalidParamsError(
        "Invalid parameters. You must define the innovation id and the userId."
      );
    }

    const filterOptions: FindOneOptions = {
      where: { owner: requestUser.id },
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
    const innovationSections = this.getInnovationSectionsMetadata(sections);

    const result: InnovationSectionResult = {
      id: innovation.id,
      name: innovation.name,
      status: innovation.status,
      sections: innovationSections,
    };

    return result;
  }

  async findAllInnovationSectionsByAssessment(
    requestUser: RequestUser,
    innovationId: string
  ) {
    if (!innovationId || !requestUser || !checkIfValidUUID(innovationId)) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const filterOptions: FindOneOptions = {
      relations: ["assessments"],
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
    const innovationSections = this.getInnovationSectionsMetadata(sections);

    const result: InnovationSectionResult = {
      id: innovation.id,
      name: innovation.name,
      status: innovation.status,
      sections: innovationSections,
    };

    return result;
  }

  async findAllSections(requestUser: RequestUser, innovationId: string) {
    // VALIDATIONS
    if (!innovationId || !requestUser || !checkIfValidUUID(innovationId)) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const filterOptions: FindOneOptions = {
      relations: ["sections", "sections.files", "owner"],
    };
    const innovation = await this.innovationService.findInnovation(
      requestUser,
      innovationId,
      filterOptions
    );

    if (!innovation) {
      throw new InnovationNotFoundError(
        "Invalid parameters. Innovation not found."
      );
    }

    const sections = await innovation.sections;
    const innovationSections: any[] = [];

    for (const key in InnovationSectionCatalogue) {
      const section = sections.find((sec) => sec.section === key);

      const sectionFields = sectionResponseSchema[key];
      innovationSections.push({
        section: this.getInnovationSectionMetadata(key, section),
        data: await this.getInnovationSectionData(
          innovation,
          section,
          sectionFields
        ),
      });
    }

    return innovationSections;
  }

  async findSection(
    requestUser: RequestUser,
    innovationId: string,
    sectionKey: string
  ) {
    // VALIDATIONS
    if (
      !innovationId ||
      !sectionKey ||
      !requestUser ||
      !checkIfValidUUID(innovationId)
    ) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const sectionFields = sectionResponseSchema[sectionKey];
    if (!sectionFields) {
      throw new SectionNotFoundError("Invalid parameters. Section not found.");
    }

    const filterOptions: FindOneOptions = {
      relations: ["sections", "sections.files", "owner"],
    };
    const innovation = await this.innovationService.findInnovation(
      requestUser,
      innovationId,
      filterOptions
    );

    if (!innovation) {
      throw new InnovationNotFoundError(
        "Invalid parameters. Innovation not found."
      );
    }

    const sections = await innovation.sections;
    const section = sections.find((sec) => sec.section === sectionKey);
    const sectionMetadata = this.getInnovationSectionMetadata(
      sectionKey,
      section
    );
    let data = {};

    if (
      requestUser.type !== UserType.ACCESSOR ||
      sectionMetadata.status === InnovationSectionStatus.SUBMITTED
    ) {
      data = await this.getInnovationSectionData(
        innovation,
        section,
        sectionFields
      );
    }

    return {
      section: sectionMetadata,
      data,
    };
  }

  async saveSection(
    requestUser: RequestUser,
    innovationId: string,
    section: string,
    data: any
  ) {
    // VALIDATIONS
    if (!innovationId || !requestUser || !section || !data) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const sectionFields = sectionBodySchema[section];
    if (!sectionFields) {
      throw new SectionNotFoundError("Invalid parameters. Section not found.");
    }

    const filterOptions: FindOneOptions = {
      relations: ["sections", "sections.files", "owner"],
      where: { owner: requestUser.id },
    };
    const innovation = await this.innovationService.find(
      innovationId,
      filterOptions
    );
    if (!innovation) {
      throw new InnovationNotFoundError(
        "Invalid parameters. Innovation not found for the user."
      );
    }

    // UPDATE INNOVATION FIELDS
    const updatedInnovation = this.getUpdatedInnovationObject(
      requestUser,
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
        createdBy: requestUser.id,
        updatedBy: requestUser.id,
        files:
          sectionFields.files && data.files
            ? data.files.map((id: string) => ({ id }))
            : [],
      });
      sections.push(innovationSection);
    } else {
      sections[innovationSectionIdx].updatedBy = requestUser.id;
      sections[innovationSectionIdx].status = InnovationSectionStatus.DRAFT;

      if (sectionFields.files) {
        const deletedFiles = sections[innovationSectionIdx].files.filter(
          (obj: InnovationFile) => !data.files.includes(obj.id)
        );

        try {
          await this.fileService.deleteFiles(deletedFiles);
        } catch (error) {
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
        if (!data[type]) continue;
        updatedInnovation[type] = await this.getUpdatedParentTypeArray(
          requestUser,
          innovation,
          type,
          data
        );
      }
    }

    if (sectionFields.innovationDependencies) {
      for (let i = 0; i < sectionFields.innovationDependencies.length; i++) {
        const dependency = sectionFields.innovationDependencies[i];
        if (!data[dependency.type]) continue;
        updatedInnovation[
          dependency.type
        ] = await this.getUpdatedInnovationDependencyArray(
          requestUser,
          innovation,
          dependency,
          data
        );
      }
    }

    updatedInnovation.updatedBy = requestUser.id;

    // const result = this.innovationService.update(
    //   innovationId,
    //   updatedInnovation
    // );

    const result = await this.connection.transaction(async (transaction) => {
      if (!updatedInnovation.id) {
        updatedInnovation.id = innovation.id;
      }

      const innov = await transaction.save(Innovation, updatedInnovation);

      if (innov.status != InnovationStatus.CREATED) {
        try {
          await this.activityLogService.createLog(
            requestUser,
            innovation,
            Activity.SECTION_DRAFT_UPDATE,
            transaction,
            {
              sectionId: section,
            }
          );
        } catch (error) {
          this.logService.error(
            `An error has occured while creating activity log from ${requestUser.id}`,
            error
          );

          throw error;
        }
      }

      return innov;
    });

    return result;
  }

  async findAll(filter?: any): Promise<InnovationSection[]> {
    return this.repository.find(filter);
  }

  async submitSections(
    requestUser: RequestUser,
    innovationId: string,
    sections: InnovationSectionCatalogue[]
  ) {
    if (!innovationId || !requestUser || !sections) {
      throw new InvalidParamsError("Invalid parameters.");
    }

    const filterOptions: FindOneOptions = {
      where: { owner: requestUser.id },
    };
    const innovation = await this.innovationService.find(
      innovationId,
      filterOptions
    );
    if (!innovation) {
      throw new InnovationNotFoundError(
        "Invalid parameters. Innovation not found for the user."
      );
    }

    const innovSections = await innovation.sections;
    const updatedActions: InnovationAction[] = [];
    let targetNotificationUsers: string[] = [];

    const result = await this.connection.transaction(
      async (transactionManager) => {
        for (let i = 0; i < sections.length; i++) {
          const secKey = sections[i];
          const secIdx = innovSections.findIndex(
            (obj) => obj.section === secKey
          );

          if (secIdx === -1) {
            const innovSectionObj = InnovationSection.new({
              innovation,
              section: InnovationSectionCatalogue[secKey],
              status: InnovationSectionStatus.SUBMITTED,
              createdBy: requestUser.id,
              updatedBy: requestUser.id,
              submittedAt: new Date(),
            });

            await transactionManager.save(InnovationSection, innovSectionObj);
          } else {
            const innovationActions = await innovSections[secIdx].actions;
            const actions = innovationActions.filter(
              (ia: InnovationAction) =>
                ia.status === InnovationActionStatus.REQUESTED
            );
            for (let i = 0; i < actions.length; i++) {
              await transactionManager.update(
                InnovationAction,
                { id: actions[i].id },
                {
                  status: InnovationActionStatus.IN_REVIEW,
                  updatedBy: requestUser.id,
                }
              );

              actions[i].status = InnovationActionStatus.IN_REVIEW;
              actions[i].innovationSection = innovSections[secIdx];
              updatedActions.push(actions[i]);
            }

            await transactionManager.update(
              InnovationSection,
              { id: innovSections[secIdx].id },
              {
                status: InnovationSectionStatus.SUBMITTED,
                updatedBy: requestUser.id,
                submittedAt: new Date(),
              }
            );

            if (innovation.status != InnovationStatus.CREATED) {
              try {
                await this.activityLogService.createLog(
                  requestUser,
                  innovation,
                  Activity.SECTION_SUBMISSION,
                  transactionManager,
                  {
                    sectionId: innovSections[secIdx].section,
                  }
                );
              } catch (error) {
                this.logService.error(
                  `An error has occured while creating activity log from ${requestUser.id}`,
                  error
                );

                throw error;
              }
            }

            if (updatedActions && updatedActions.length > 0) {
              try {
                await this.activityLogService.createLog(
                  requestUser,
                  innovation,
                  Activity.ACTION_STATUS_IN_REVIEW_UPDATE,
                  transactionManager,
                  {
                    totalActions: updatedActions.length,
                    sectionId: secKey,
                  }
                );
              } catch (error) {
                this.logService.error(
                  `An error has occured while creating activity log from ${requestUser.id}`,
                  error
                );

                throw error;
              }
            }
          }
        }
      }
    );

    for (let index = 0; index < updatedActions.length; index++) {
      const updatedAction = updatedActions[index];
      targetNotificationUsers = [updatedAction.createdBy];
      try {
        await this.notificationService.create(
          requestUser,
          NotificationAudience.ACCESSORS,
          innovationId,
          NotifContextType.ACTION,
          NotifContextDetail.ACTION_UPDATE,
          updatedAction.id,
          {
            section: updatedAction.innovationSection.section,
            actionStatus: updatedAction.status,
            actionCode: updatedAction.displayId,
          },
          targetNotificationUsers
        );
      } catch (error) {
        this.logService.error(
          `An error has occured while creating a notification of type ${NotificationContextType.ACTION} from ${requestUser.id}`,
          error
        );
      }

      if (updatedAction.status === InnovationActionStatus.IN_REVIEW) {
        try {
          await this.notificationService.sendEmail(
            requestUser,
            EmailNotificationTemplate.ACCESSORS_ACTION_TO_REVIEW,
            innovationId,
            updatedAction.id,
            targetNotificationUsers
          );
        } catch (error) {
          this.logService.error(
            `An error has occured while creating an email notification of type ${NotificationContextType.ACTION} from ${requestUser.id}`,
            error
          );
        }
      }
    }

    return result;
  }

  async createSection(
    requestUser: RequestUser,
    innovationId: string,
    section: InnovationSectionCatalogue,
    status?: InnovationSectionStatus
  ) {
    const innovationSection = InnovationSection.new({
      innovation: { id: innovationId },
      section,
      status: status || InnovationSectionStatus.NOT_STARTED,
      createdBy: requestUser.id,
      updatedBy: requestUser.id,
    });

    return this.create(innovationSection);
  }

  private async getInnovationSectionData(
    innovation: Innovation,
    section: InnovationSection,
    sectionFields: any
  ) {
    // GET INNOVATION FIELDS
    const data = {
      ...this.getInnovationFilteredObject(
        innovation,
        sectionFields.innovationFields
      ),
    };

    if (sectionFields.files && section) {
      const files = section.files?.map((obj: InnovationFile) => ({
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

        data[type] = await this.getParentTypeArray(innovation, type);
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

    return data;
  }

  private getInnovationSectionsMetadata(
    sections: InnovationSection[]
  ): InnovationSectionModel[] {
    const innovationSections: InnovationSectionModel[] = [];

    for (const key in InnovationSectionCatalogue) {
      const section = sections.find((sec) => sec.section === key);
      innovationSections.push(this.getInnovationSectionMetadata(key, section));
    }

    return innovationSections;
  }

  private getInnovationSectionMetadata(
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

  private async getUpdatedParentTypeArray(
    requestUser: RequestUser,
    parent: any,
    type: string,
    data: any[]
  ) {
    const original: any[] = await parent[type];

    const newValues: string[] = data[type];
    if (newValues !== null) {
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
            createdBy: requestUser.id,
            updatedBy: requestUser.id,
            createdAt: new Date(),
            deletedAt: null,
          });
        }
      });
    }
    return original;
  }

  private async getUpdatedInnovationDependencyArray(
    requestUser: RequestUser,
    innovation: Innovation,
    dependency: any,
    data: any[]
  ) {
    const original: any[] = await innovation[dependency.type];

    const newValues: any = data[dependency.type];
    const filter: string[] = dependency.fields;
    const subtypes: string[] = dependency.subtypes;

    if (!newValues) return original;

    original
      .filter((obj) => !newValues.some((e: any) => e.id === obj.id))
      .forEach((obj) => {
        obj.deletedAt = new Date();
      });

    for (
      let newValuesIdx = 0;
      newValuesIdx < newValues.length;
      newValuesIdx++
    ) {
      const obj = newValues[newValuesIdx];
      let newObject: any;
      let files: any[];

      if (dependency.files && obj["files"]) {
        files = obj["files"].map((id: string) => ({ id }));
      }

      if (obj.id) {
        const objectIndex = original.findIndex((e: any) => e.id === obj.id);

        if (objectIndex === -1) {
          throw new InvalidDataError("Invalid object id");
        }

        newObject = this.getUpdatedInnovationObject(
          requestUser,
          original[objectIndex],
          obj,
          filter
        );

        if (files) newObject.files = files;
        // MANAGE SPECIFIC SUBTYPES
        if (subtypes) {
          for (let i = 0; i < subtypes.length; i++) {
            const type = subtypes[i];

            newObject[type] = await this.getUpdatedParentTypeArray(
              requestUser,
              newObject,
              type,
              obj
            );
          }
        }

        original[objectIndex] = newObject;
      } else {
        newObject = this.getInnovationFilteredObject(obj, filter);
        newObject.createdBy = requestUser.id;
        newObject.updatedBy = requestUser.id;

        if (files) newObject.files = files;
        // MANAGE SPECIFIC SUBTYPES
        if (subtypes) {
          for (let i = 0; i < subtypes.length; i++) {
            const type = subtypes[i];

            newObject[type] = await this.getUpdatedParentTypeArray(
              requestUser,
              newObject,
              type,
              obj
            );
          }
        }

        original.push(newObject);
      }
    }

    return original;
  }

  private getUpdatedInnovationObject(
    requestUser: RequestUser,
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
    newObject.updatedBy = requestUser.id;

    return newObject;
  }

  private async getParentTypeArray(parent: any, type: string) {
    const original = await parent[type];

    return original.flatMap((obj: any) => obj.type);
  }

  private async getInnovationFilteredDependencyArray(
    innovation: Innovation,
    dependency: any
  ) {
    const original = await innovation[dependency.type];
    const subtypes: string[] = dependency.subtypes;
    const result = [];

    for (let idx = 0; idx < original.length; idx++) {
      const originalObj = original[idx];

      const obj = this.getInnovationFilteredObject(
        originalObj,
        dependency.fields
      );
      if (subtypes) {
        for (let i = 0; i < subtypes.length; i++) {
          const type = subtypes[i];

          obj[type] = await this.getParentTypeArray(originalObj, type);
        }
      }

      result.push(obj);
    }

    return result;
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
