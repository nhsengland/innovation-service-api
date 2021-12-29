import { SLSEventType } from "@services/types";
import { CustomContext } from "utils/types";

export const validate = async (
  context: CustomContext,
  code: string,
  id: string,
  action: SLSEventType
) => {
  return await context.services.AuthService.validate2LS(
    context.auth.decodedJwt.oid,
    action,
    code,
    id
  );
};
