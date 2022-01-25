import { Context } from "@azure/functions";
import { Services } from "@services/index";
import { RequestUser } from "@services/models/RequestUser";

type DecodedJwt = {
  oid: string;
  surveyId?: string;
};

type Auth = {
  requestUser?: RequestUser;
  decodedJwt?: DecodedJwt;
};

export interface CustomContext extends Context {
  auth: Auth;
  services: Services;
  logger?: any;
}

export enum Severity {
  Verbose = 0,
  Information = 1,
  Warning = 2,
  Error = 3,
  Critical = 4,
}

export enum ServiceRole {
  ADMIN = "ADMIN",
  SERVICE_TEAM = "SERVICE_TEAM",
}
