import { InnovationStatus, InnovationSupportStatus, User } from "@domain/index";

export interface InnovatorInnovationSummary {
  id: string;
  name: string;
  description: string;
  countryName: string;
  postcode?: string;
  ownerId: User;
  status: InnovationStatus;
  submittedAt: Date;
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
    companySize: string;
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
  lockedInnovatorValidation: {
    displayIsInnovatorLocked: boolean;
    innovatorName?: string;
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
    companySize: string;
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
  lockedInnovatorValidation: {
    displayIsInnovatorLocked: boolean;
    innovatorName?: string;
  };
}
