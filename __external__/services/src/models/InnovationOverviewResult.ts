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
    status: string;
    company: string;
    location: string;
    description: string;
    categories: string[];
  };
  contact: {
    name: string;
    email: string;
    phone: string;
  };
}
