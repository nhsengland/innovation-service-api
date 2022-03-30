/**
 * BUSINESS RELATED
 */
export class InnovationNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InnovationNotFoundError";
  }
}

export class InnovationSupportNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InnovationSupportNotFoundError";
  }
}

export class InnovationTransferNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InnovationTransferNotFoundError";
  }
}

export class InnovationTransferAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InnovationTransferAlreadyExistsError";
  }
}

export class SectionNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SectionNotFoundError";
  }
}

export class MissingUserOrganisationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingUserOrganisationError";
  }
}

export class MissingUserOrganisationUnitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingUserOrganisationUnitError";
    this.message = message || "Innovation not found for the user.";
  }
}

/**
 * GENERIC
 */
export class ResourceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResourceNotFoundError";
  }
}

export class InvalidDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidDataError";
  }
}

export class InvalidParamsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidParamsError";
  }
}

export class InvalidUserRoleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUserRoleError";
  }
}

export class InvalidOrganisationAcronymError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidOrganisationAcronymError";
  }
}

export class InvalidUserTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUserTypeError";
  }
}

export class InvalidEmailTemplateProps extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidEmailTemplateProps";
  }
}

export class EmailTemplateNotFound extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailTemplateNotFound";
  }
}

export class InvalidAPIKey extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAPIKey";
  }
}

export class InvalidSectionStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSectionStateError";
  }
}

export class LastAssessmentUserOnPlatformError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LastAssessmentUserOnPlatformError";
  }
}

export class LastAccessorUserOnOrganisationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LastAccessorUserOnOrganisationError";
  }
}

export class LastAccessorUserOnOrganisationUnitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LastAccessorUserOnOrganisationUnitError";
  }
}

export class LastAccessorFromUnitProvidingSupportError extends Error {
  data: any;
  constructor(message: string, data?: any) {
    super(message);
    this.name = "LastAccessorFromUnitProvidingSupportError";
    this.data = data;
  }
}

export class UserEmailNotFound extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserEmailNotFound";
  }
}
