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
}
