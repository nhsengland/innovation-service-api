import { InnovationStatus, InnovationSupportStatus, User } from "@domain/index";

export interface InnovatorInnovationSummary {
  id: string;
  name: string;
  description: string;
  countryName: string;
  postcode?: string;
  ownerId: User;
  status: InnovationStatus;
  actions: {
    requestedCount: number;
    inReviewCount: number;
  };
  assessment: {
    id: string;
  };
}

export interface AccessorInnovationSummary {
  summary: {
    id: string;
    name: string;
    status: InnovationStatus;
    company: string;
    countryName: string;
    postCode: string;
    description: string;
    categories: string[];
    otherCategoryDescription: string;
  };
  contact: {
    name: string;
  };
  assessment: {
    id: string;
  };
  support: {
    id: string;
    status: InnovationSupportStatus;
  };
}

export interface AssessmentInnovationSummary {
  summary: {
    id: string;
    name: string;
    status: InnovationStatus;
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
