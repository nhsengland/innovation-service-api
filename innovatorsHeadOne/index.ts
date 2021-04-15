import { Context, HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import * as validation from "./validation";
import * as Responsify from "../utils/responsify";
import { SetupConnection, Validate } from "../utils/decorators";

class InnovatorsHeadOne {
  @SetupConnection()
  @Validate(validation.ValidateParams, "params", "Invalid Query Parameters")
  static async httpTrigger(context: Context, req: HttpRequest): Promise<void> {
    const oid = req.params.innovatorId;

    const result = await persistence.findInnovatorById(oid);

    if (result) {
      context.res = Responsify.Ok();
      return;
    }
    context.res = Responsify.NotFound(null);
  }
}

export default InnovatorsHeadOne.httpTrigger;
