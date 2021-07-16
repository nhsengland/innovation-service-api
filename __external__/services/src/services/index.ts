import { AccessorService } from "./Accessor.service";
import { CommentService } from "./Comment.service";
import { FileService } from "./File.service";
import { InnovationService } from "./Innovation.service";
import { InnovationActionService } from "./InnovationAction.service";
import { InnovationAssessmentService } from "./InnovationAssessment.service";
import { InnovationEvidenceService } from "./InnovationEvidence.service";
import { InnovationSectionService } from "./InnovationSection.service";
import { InnovationSupportService } from "./InnovationSupport.service";
import { InnovatorService } from "./Innovator.service";
import { OrganisationService } from "./Organisation.service";
import { UserService } from "./User.service";
import { NotificationService } from "./Notification.service";

export type Services = {
  AccessorService?: AccessorService;
  UserService?: UserService;
  CommentService?: CommentService;
  FileService?: FileService;
  InnovationActionService?: InnovationActionService;
  InnovationAssessmentService?: InnovationAssessmentService;
  InnovationService?: InnovationService;
  InnovationEvidenceService?: InnovationEvidenceService;
  InnovationSectionService?: InnovationSectionService;
  InnovationSupportService?: InnovationSupportService;
  InnovatorService?: InnovatorService;
  OrganisationService?: OrganisationService;
  NotificationService?: NotificationService;
};

function initialize<T>(constructors: T[], connectionName?: string): Services {
  function factory<T>(X: { new (str): T }): T {
    return new X(connectionName) as T;
  }
  const retval = {};
  constructors.forEach((constructor) => {
    const instance = factory(constructor as any) as T;
    retval[constructor["name"]] = instance;
  });
  return retval;
}

export const initializeServices = initialize;
export const initializeAllServices = (connectionName?: string): Services => {
  const services = [
    AccessorService,
    UserService,
    CommentService,
    FileService,
    InnovationActionService,
    InnovationAssessmentService,
    InnovationService,
    InnovationEvidenceService,
    InnovationSectionService,
    InnovationSupportService,
    InnovatorService,
    OrganisationService,
    NotificationService,
  ];
  return initialize(services, connectionName);
};
