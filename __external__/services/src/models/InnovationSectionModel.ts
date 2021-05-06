import {
  InnovationActionStatus,
  InnovationSectionCatalogue,
  InnovationSectionStatus,
} from "@domain/index";

export interface InnovationSectionModel {
  id: string;
  section: InnovationSectionCatalogue;
  status: InnovationSectionStatus;
  actionStatus: InnovationActionStatus;
  updatedAt: Date;
}
