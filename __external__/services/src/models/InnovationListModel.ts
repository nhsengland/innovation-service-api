import { Innovation } from "@domain/index";

export interface InnovationListModel {
  data: InnovationViewModel[];
  count: number;
}

export interface InnovationViewModel {
  id: string;
  name: string;
  submittedAt: string;
  countryName: string;
  postCode: string;
  mainCategory: string;
  assessment: {
    createdAt: string;
    assignTo: { name: string };
    finishedAt: string;
  };
  organisations: string[];
}
