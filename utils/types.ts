import { Context } from "@azure/functions";
import { Services } from "nhs-aac-domain-services";

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
