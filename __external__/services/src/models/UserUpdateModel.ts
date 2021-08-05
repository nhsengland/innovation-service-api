import { AccessorOrganisationRole, UserType } from "@domain/index";

export interface UserUpdateModel {
  id: string;
  properties: { [key: string]: string };
}
