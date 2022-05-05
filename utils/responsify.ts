import {
  InnovationNotFoundError,
  InnovationSupportNotFoundError,
  InnovationTransferAlreadyExistsError,
  InnovationTransferNotFoundError,
  InvalidDataError,
  InvalidParamsError,
  InvalidUserRoleError,
  InvalidUserTypeError,
  LastAccessorFromUnitProvidingSupportError,
  MissingUserOrganisationError,
  MissingUserOrganisationUnitError,
  ResourceNotFoundError,
  SectionNotFoundError,
  UniqueKeyError,
} from "@services/errors";

/* internal */
const defaultRes = {
  headers: {
    "Content-Type": "application/json",
  },
  status: -1,
  body: {},
  isRaw: true,
};

const getFormattedRes = (status: number, data?: any, headers?: any) => {
  return {
    ...defaultRes,
    status,
    body: data,
    headers: {
      ...defaultRes.headers,
      ...headers,
    },
  };
};

/******************/

/* external api */

/* 200 Range */
export const Ok = (data?: any, headers?: any) => {
  return getFormattedRes(200, data, headers);
};

export const Created = (data?: any, headers?: any) => {
  return getFormattedRes(201, data, headers);
};

export const NoContent = (data?: any, headers?: any) => {
  return getFormattedRes(204, data, headers);
};

/* 400 Range */
export const BadRequest = (data?: any, headers?: any) => {
  return getFormattedRes(400, data, headers);
};

export const Unauthorized = (data?: any, headers?: any) => {
  return getFormattedRes(401, data, headers);
};

export const Forbidden = (data?: any, headers?: any) => {
  return getFormattedRes(403, data, headers);
};

export const NotFound = (data?: any, headers?: any) => {
  return getFormattedRes(404, data, headers);
};

export const UnprocessableEntity = (data?: any, headers?: any) => {
  return getFormattedRes(422, data, headers);
};

/* 500 Range */

export const Internal = (data?: any, headers?: any) => {
  return getFormattedRes(500, data, headers);
};

/*****************/

export const ErroHandling = (error: Error) => {
  if (
    error instanceof InvalidParamsError ||
    error instanceof InnovationNotFoundError ||
    error instanceof InnovationSupportNotFoundError ||
    error instanceof InnovationTransferNotFoundError ||
    error instanceof SectionNotFoundError ||
    error instanceof InvalidDataError ||
    error instanceof UniqueKeyError
  ) {
    return BadRequest({
      error: error.name,
    });
  } else if (error instanceof ResourceNotFoundError) {
    return NotFound({
      error: error.name,
    });
  } else if (
    error instanceof MissingUserOrganisationError ||
    error instanceof MissingUserOrganisationUnitError ||
    error instanceof InvalidUserRoleError ||
    error instanceof InvalidUserTypeError
  ) {
    return Forbidden({
      error: error.name,
    });
  } else if (error instanceof InnovationTransferAlreadyExistsError) {
    return UnprocessableEntity({
      error: error.name,
    });
  } else if (error instanceof LastAccessorFromUnitProvidingSupportError) {
    return Forbidden({
      data: error.data,
      error: error,
    });
  } else {
    return Internal();
  }
};
