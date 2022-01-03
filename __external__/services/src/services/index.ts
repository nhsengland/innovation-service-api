import { AccessorService } from "./Accessor.service";
import { CommentService } from "./Comment.service";
import { FileService } from "./File.service";
import { InnovationService } from "./Innovation.service";
import { InnovationActionService } from "./InnovationAction.service";
import { InnovationAssessmentService } from "./InnovationAssessment.service";
import { InnovationEvidenceService } from "./InnovationEvidence.service";
import { InnovationSectionService } from "./InnovationSection.service";
import { InnovationSuggestionService } from "./InnovationSuggestion.service";
import { InnovationSupportService } from "./InnovationSupport.service";
import { InnovationSupportLogService } from "./InnovationSupportLog.service";
import { InnovationTransferService } from "./InnovationTransfer.service";
import { InnovatorService } from "./Innovator.service";
import { NotificationService } from "./Notification.service";
import { OrganisationService } from "./Organisation.service";
import { UserService } from "./User.service";
import { ActivityLogService } from "./ActivityLog.service";
import { AuthService } from "./Auth.service";

export type Services = {
  AccessorService?: AccessorService;
  UserService?: UserService;
  CommentService?: CommentService;
  FileService?: FileService;
  InnovationActionService?: InnovationActionService;
  InnovationAssessmentService?: InnovationAssessmentService;
  InnovationService?: InnovationService;
  InnovationEvidenceService?: InnovationEvidenceService;
  InnovationSuggestionService?: InnovationSuggestionService;
  InnovationSectionService?: InnovationSectionService;
  InnovationSupportService?: InnovationSupportService;
  InnovationSupportLogService?: InnovationSupportLogService;
  InnovationTransferService?: InnovationTransferService;
  InnovatorService?: InnovatorService;
  OrganisationService?: OrganisationService;
  NotificationService?: NotificationService;
  ActivityLogService?: ActivityLogService;
  AuthService?: AuthService;
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
    InnovationSuggestionService,
    InnovationSupportService,
    InnovationSupportLogService,
    InnovationTransferService,
    InnovatorService,
    OrganisationService,
    NotificationService,
    ActivityLogService,
    AuthService,
  ];
  return initialize(services, connectionName);
};
