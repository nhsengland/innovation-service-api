import { HttpRequest } from "@azure/functions";
import { UserType } from "@services/index";
import {
  AllowedUserType,
  AppInsights,
  JwtDecoder,
  SQLConnector,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";

class AssessmentsGetInnovationComments {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  @AllowedUserType(UserType.ASSESSMENT)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const innovationId = req.params.innovationId;

    let order;
    const query: any = req.query;

    if (query.order) {
      order = JSON.parse(query.order);
    }

    let result;
    try {
      result = await persistence.findInnovationComments(
        context,
        innovationId,
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

export default AssessmentsGetInnovationComments.httpTrigger;
