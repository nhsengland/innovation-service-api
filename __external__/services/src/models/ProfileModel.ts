import { UserType } from "@domain/index";
import { OrganisationUserModel } from "./OrganisationUserModel";

export interface ProfileModel {
  id: string;
  displayName: string;
  type: UserType;
  organisations: OrganisationUserModel[];
  email?: string;
  phone?: string;
  passwordResetOn?:string;
}
