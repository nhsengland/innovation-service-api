import { Context, HttpRequest } from "@azure/functions";
import { OrganisationUser } from "nhs-aac-domain-services";
import { decodeToken } from "../authentication";
import { setIsSQLConnected, setupSQLConnection } from "../connection";
import * as Responsify from "../responsify";
import { loadAllServices } from "../serviceLoader";
import { CustomContext } from "../types";

export function SQLConnector() {
  return function (
    target: Object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context: CustomContext = args[0];
      try {
        await setupSQLConnection();
        context.services = await loadAllServices();
      } catch (error) {
        context.log.error(error);
        context.res = Responsify.Internal({
          error: "Error establishing connection with the datasource.",
        });
        setIsSQLConnected(false);
        return;
      }
      context.log.info("Database connection established");
      await original.apply(this, args);
      return;
    };
  };
}

export function Validator(
  validationFunc: Function,
  reqProperty: string,
  errorMessage?: string
) {
  return function (
    target: Object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context: Context = args[0];
      const req: HttpRequest = args[1];

      const validate = validationFunc(req[reqProperty]);
      if (validate.error) {
        context.log.error(validate.error);
        context.res = Responsify.BadData({
          error: errorMessage || "validation failed",
        });
        return;
      }
      await original.apply(this, args);
      return;
    };
  };
}

export function JwtDecoder() {
  return function (
    target: Object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context: CustomContext = args[0];
      const req: HttpRequest = args[1];
      const token = req.headers.authorization;
      const jwt = decodeToken(token);

      context.auth = {
        decodedJwt: {
          oid: jwt.oid,
          surveyId: jwt.extension_surveyId,
        },
      };

      await original.apply(this, args);
      return;
    };
  };
}

export function OrganisationRoleValidator(...roles: any[]) {
  return function (
    target: Object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context: CustomContext = args[0];
      const oid = context.auth.decodedJwt.oid;

      const userOrganisations: OrganisationUser[] = await context.services.OrganisationService.findUserOrganisations(
        oid
      );
      const filteredOrganisations = userOrganisations.filter((uo) =>
        roles.includes(uo.role)
      );

      if (filteredOrganisations.length == 0) {
        throw new Error("Invalid user. User has no valid roles.");
      }

      context.auth.userOrganisations = filteredOrganisations;

      await original.apply(this, args);
      return;
    };
  };
}
