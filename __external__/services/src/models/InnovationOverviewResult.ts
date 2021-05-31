import { InnovationStatus, User } from "@domain/index";

export interface InnovationOverviewResult {
  id: string;
  name: string;
  description: string;
  countryName: string;
  postcode?: string;
  ownerId: User;
  status: InnovationStatus;
  actionsCount: number;
  commentsCount: number;
}

export interface AssessmentInnovationSummary {
  summary: {
    id: string;
    name: string;
    status: string;
    company: string;
    countryName: string;
    postCode: string;
    description: string;
    categories: string[];
    otherCategoryDescription: string;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  assessment: {
    id: string;
    assignToName: string;
  };
}
