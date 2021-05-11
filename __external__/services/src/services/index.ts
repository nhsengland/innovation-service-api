import { AccessorService } from "./Accessor.service";
import { ActionService } from "./Action.service";
import { UserService } from "./User.service";
import { CommentService } from "./Comment.service";
import { InnovationService } from "./Innovation.service";
import { InnovationSectionService } from "./InnovationSection.service";
import { InnovatorService } from "./Innovator.service";
import { OrganisationService } from "./Organisation.service";
import { FileService } from "./File.service";
import { InnovationEvidenceService } from "./InnovationEvidence.service";

export type Services = {
  AccessorService?: AccessorService;
  ActionService?: ActionService;
  UserService?: UserService;
  CommentService?: CommentService;
  FileService?: FileService;
  InnovationService?: InnovationService;
  InnovationEvidenceService?: InnovationEvidenceService;
  InnovationSectionService?: InnovationSectionService;
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
    InnovationService,
    InnovationEvidenceService,
    InnovationSectionService,
    InnovatorService,
    OrganisationService,
  ];
  return initialize(services, connectionName);
};
