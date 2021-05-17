import { Context } from "@azure/functions";
import { Services } from "@services/index";

type DecodedJwt = {
  oid: string;
  surveyId?: string;
};

type Auth = {
  userOrganisations?: any[];
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
