import { CustomContext } from "utils/types";

export const validate = async (context: CustomContext, code: string) => {
  return await context.services.AuthService.validate2LS(
    context.auth.decodedJwt.oid,
    code
  );
};
