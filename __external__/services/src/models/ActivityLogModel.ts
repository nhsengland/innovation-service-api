import { OrganisationUnitModel } from "./OrganisationUnitModel";

export interface ActivityLogModel {
    createdAt: Date;
    id: string;
    type: string;
    activity: string;
    params?: { [key: string]: string };
}
