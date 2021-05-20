import { HttpRequest } from "@azure/functions";
import { OrganisationUser } from "@services/index";
import { getInstance, start } from "../logging/insights";
import { decodeToken } from "../authentication";
import {
  setIsSQLConnected,
  setIsCosmosConnected,
  setupCosmosDb,
  setupSQLConnection,
} from "../connection";
import * as Responsify from "../responsify";
import { loadAllServices } from "../serviceLoader";
import { CustomContext, Severity } from "../types";

export function SQLConnector() {
  return function (
    target: Object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const decoratorId = "SQLConnector";

    const original = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context: CustomContext = args[0];
      try {
        await setupSQLConnection();
        context.services = await loadAllServices();
      } catch (error) {
        context.log.error(error);
        context.logger(
          `${decoratorId}: an error has occurred. Check details.`,
          Severity.Error,
          {
            error,
          }
        );
        context.res = Responsify.Internal({
          error: "Error establishing connection with the datasource.",
        });
        setIsSQLConnected(false);
        return;
      }

      context.log.info("Database connection established");

      context.logger("@SQLConnector", Severity.Information, {
        isConnected: true,
      });

      await original.apply(this, args);
      return;
    };
  };
}

export function CosmosConnector() {
  return function (
    target: Object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const decoratorId = "CosmosConnector";

    const original = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const context: CustomContext = args[0];
      try {
        await setupCosmosDb();
      } catch (error) {
        context.log.error(error);
        context.logger(
          `${decoratorId}: an error has occurred. Check details.`,
          Severity.Error,
          {
            error,
          }
        );
        context.res = Responsify.Internal({
          error: "Error establishing connection with the datasource.",
        });
        setIsCosmosConnected(false);
        return;
      }

      context.log.info("CosmosDB connection established");

      context.logger("@CosmosConnector", Severity.Information, {
        isConnected: true,
      });

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
    const decoratorId = "Validator";
    const original = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context: CustomContext = args[0];
      const req: HttpRequest = args[1];

      const validate = validationFunc(req[reqProperty]);
      if (validate.error) {
        context.log.error(validate.error);
        context.logger(
          `${decoratorId}: an error has occurred. Check details.`,
          Severity.Error,
          {
            error: validate.error,
          }
        );
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
    const decoratorId = "OrganisationRoleValidator";
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
        context.log.error(
          `Invalid user. User has no valid roles. {oid: ${oid}}`
        );
        context.logger(
          `${decoratorId}: an error has occurred. Check details.`,
          Severity.Error,
          {
            error: `Invalid user. User has no valid roles. {oid: ${oid}}`,
          }
        );
        context.res = Responsify.Forbidden();
        return;
      }

      context.auth.userOrganisations = filteredOrganisations;

      await original.apply(this, args);
      return;
    };
  };
}

export function AppInsights() {
  return function (
    target: Object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const insights = getInstance();
    const original = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context: CustomContext = args[0];
      const req: HttpRequest = args[1];
      start();

      const correlationContext = insights.startOperation(context, req);

      return insights.wrapWithCorrelationContext(async () => {
        const loggerFunc = (message, severity, props, error?) => {
          const token = req.headers.authorization;
          let authenticatedUser = {};

          if (token) {
            const jwt = decodeToken(token);
            authenticatedUser = jwt.oid;
          }

          const properties = {
            properties: {
              ...props,
              authenticatedUser,
            },
          };

          // logs all as a trace
          insights.defaultClient.trackTrace({
            message,
            severity,
            properties,
          });
        };

        context.logger = loggerFunc;

        await original.apply(this, args);

        insights.defaultClient.flush();
      }, correlationContext)();
    };
  };
}
