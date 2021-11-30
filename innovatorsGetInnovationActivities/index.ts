import { HttpRequest } from "@azure/functions";
import { UserType } from "@domain/index";
import {
  AllowedUserType,
  AppInsights,
  JwtDecoder,
  SQLConnector,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";

class InnovatorsGetInnovationActivities {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  @AllowedUserType(UserType.INNOVATOR)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const innovationId = req.params.innovationId;

    const query: any = req.query;

    const skip = parseInt(query.skip);
    const take = parseInt(query.take);
    const activityTypes = query.activityTypes;

    let order;
    if (query.order) {
      order = JSON.parse(query.order);
    }

    let result;
    try {
      result = await persistence.getInnovationActivitiesById(
        context,
        innovationId,
        take,
        skip,
        activityTypes,
        order
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

export default InnovatorsGetInnovationActivities.httpTrigger;
