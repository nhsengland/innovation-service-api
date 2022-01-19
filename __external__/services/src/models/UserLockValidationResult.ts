import {
  LastAssessmentUserOnPlatformError,
  LastAccessorUserOnOrganisationError,
  LastAccessorUserOnOrganisationUnitError,
  LastAccessorFromUnitProvidingSupportError,
} from "@services/errors";
import { UserLockValidationCode } from "@services/types";

export type UserLockValidationResult = {
  error:
    | LastAssessmentUserOnPlatformError
    | LastAccessorUserOnOrganisationError
    | LastAccessorUserOnOrganisationUnitError
    | LastAccessorFromUnitProvidingSupportError;
  code: UserLockValidationCode;
};
