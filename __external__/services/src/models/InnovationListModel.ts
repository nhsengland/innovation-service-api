export interface InnovationListModel {
  data: InnovationViewModel[];
  count: number;
  tabInfo: { [key: string]: number };
}

export interface InnovationViewModel {
  id: string;
  name: string;
  submittedAt: string;
  countryName: string;
  postCode: string;
  mainCategory: string;
  otherMainCategoryDescription: string;
  assessment: {
    createdAt: string;
    assignTo: { name: string };
    finishedAt: string;
  };
  organisations: string[];
  notifications?: {
    count: number;
    isNew: boolean;
  };
}
