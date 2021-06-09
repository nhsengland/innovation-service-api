import { AccessorService } from "./Accessor.service";
import { ActionService } from "./Action.service";
import { CommentService } from "./Comment.service";
import { FileService } from "./File.service";
import { InnovationService } from "./Innovation.service";
import { InnovationAssessmentService } from "./InnovationAssessment.service";
import { InnovationEvidenceService } from "./InnovationEvidence.service";
import { InnovationSectionService } from "./InnovationSection.service";
import { InnovationSupportService } from "./InnovationSupport.service";
import { InnovatorService } from "./Innovator.service";
import { OrganisationService } from "./Organisation.service";
import { UserService } from "./User.service";

export type Services = {
  AccessorService?: AccessorService;
  ActionService?: ActionService;
  UserService?: UserService;
  CommentService?: CommentService;
  FileService?: FileService;
  InnovationAssessmentService?: InnovationAssessmentService;
  InnovationService?: InnovationService;
  InnovationEvidenceService?: InnovationEvidenceService;
  InnovationSectionService?: InnovationSectionService;
  InnovationSupportService?: InnovationSupportService;
  InnovatorService?: InnovatorService;
  OrganisationService?: OrganisationService;
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
    ActionService,
    UserService,
    CommentService,
    FileService,
    InnovationAssessmentService,
    InnovationService,
    InnovationEvidenceService,
    InnovationSectionService,
    InnovationSupportService,
    InnovatorService,
    OrganisationService,
  ];
  return initialize(services, connectionName);
};
