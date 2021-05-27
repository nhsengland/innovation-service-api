import { Innovation } from "@domain/index";

export interface InnovationListModel {
  data: InnovationViewModel[];
  count: number;
}

export interface InnovationViewModel {
  awaiting: {
    id: string;
    name: string;
    submittedAt: string;
    location: string;
    mainCategory: string;
  };
  inProgress: {
    id: string;
    name: string;
    assessmentStartDate: string;
    assessedBy: string;
    mainCategory: string;
  };
  assessmentComplete: {
    id: string;
    name: string;
    assessmentDate: string;
    engagingEntities: string[];
    mainCategory: string;
  };
}
