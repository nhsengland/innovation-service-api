import { LastAccessorUserOnOrganisationUnitError } from "@services/errors";
import { UserChangeRoleValidationCode } from "@services/types";

export type UserChangeRoleValidationResult = {
  code: UserChangeRoleValidationCode;
  meta?: { [key: string]: any };
};
