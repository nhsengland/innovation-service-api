import { HttpRequest } from "@azure/functions";
import { AccessorOrganisationRole } from "@domain/index";
import {
  AppInsights,
  JwtDecoder,
  OrganisationRoleValidator,
  SQLConnector,
  Validator,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";
import * as validation from "./validation";

class AccessorsUpdateInnovationAction {
  @AppInsights()
  @SQLConnector()
  @Validator(validation.ValidatePayload, "body", "Invalid Payload")
  @JwtDecoder()
  @OrganisationRoleValidator(
    AccessorOrganisationRole.QUALIFYING_ACCESSOR,
    AccessorOrganisationRole.ACCESSOR
  )
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const action = req.body;
    const actionId = req.params.actionId;
    const accessorId = req.params.userId;
    const innovationId = req.params.innovationId;

    let result;
    try {
      result = await persistence.updateInnovationAction(
        context,
        actionId,
        accessorId,
        innovationId,
        action
      );
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }

    context.res = Responsify.Ok({ id: result.id });
  }
}

export default AccessorsUpdateInnovationAction.httpTrigger;
