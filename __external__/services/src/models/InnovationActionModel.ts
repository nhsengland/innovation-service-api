import { InnovationActionStatus } from "@domain/index";

export interface InnovationActionModel {
  id: string;
  displayId: string;
  status: InnovationActionStatus;
  description: string;
  section: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    name: string;
    organisationName: string;
    organisationUnitName: string;
  };
}
