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
