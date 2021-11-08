import { HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import * as Responsify from "../utils/responsify";
import {
  AllowedUserType,
  AppInsights,
  JwtDecoder,
  SQLConnector,
  Validator,
} from "../utils/decorators";
import { CustomContext, Severity } from "../utils/types";
import { UserType } from "@services/index";
import { ValidateQuery } from "./validation";
import { orderClauseMappings } from "./mappers";
import { parse } from "../utils/mapper";

class AssessmentsListInnovations {
  @AppInsights()
  @Validator(ValidateQuery, "query", "Missing query fields")
  @SQLConnector()
  @JwtDecoder()
  @AllowedUserType(UserType.ASSESSMENT)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const statuses = req.query.status.split(",");
    const skip = parseInt(req.query.skip);
    const take = parseInt(req.query.take);
    let order;
    const query: any = req.query;

    if (query.order) {
      order = JSON.parse(query.order);
    }

    const mappedOrder = parse(order, orderClauseMappings);

    let result;
    try {
      result = await persistence.getInnovationList(
        context,
        statuses,
        skip,
        take,
        mappedOrder,
        query.supportFilter
      );
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default AssessmentsListInnovations.httpTrigger;
