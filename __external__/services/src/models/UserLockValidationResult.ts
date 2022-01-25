import {
  LastAssessmentUserOnPlatformError,
  LastAccessorUserOnOrganisationError,
  LastAccessorUserOnOrganisationUnitError,
  LastAccessorFromUnitProvidingSupportError,
} from "@services/errors";
import { UserLockValidationCode } from "@services/types";

export type UserLockValidationResult = {
  code: UserLockValidationCode;
  meta?: { [key: string]: any };
};
