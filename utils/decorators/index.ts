import { Context, HttpRequest } from "@azure/functions";
import { setupSQLConnection } from "../connection";
import * as Responsify from "../responsify";

export function SetupConnection() {
  return function (
    target: Object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context: Context = args[0];
      try {
        await setupSQLConnection();
      } catch (error) {
        context.log.error(error);
        context.res = Responsify.Internal({
          error: "Error establishing connection with the datasource.",
        });
        return;
      }
      context.log.info("Database connection established");
      await original.apply(this, args);
      return;
    };
  };
}

export function Validate(validationFunc: Function) {
  return function (
    target: Object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const context: Context = args[0];
      const req: HttpRequest = args[1];

      const validate = validationFunc(req.headers);
      if (validate.error) {
        context.log.error(validate.error);
        context.res = Responsify.BadRequest({
          error: "Invalid path parameters",
        });
        return;
      }
      original.apply(this, args);
      return;
    };
  };
}
