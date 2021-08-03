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
