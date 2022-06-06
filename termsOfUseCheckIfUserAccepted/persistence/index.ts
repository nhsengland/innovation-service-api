import { CustomContext } from "../../utils/types";

export const termsOfUseCheckIfUserAccepted = async (context: CustomContext) => {
  const result = await context.services.TermsOfUseService.checkIfUserAccepted(
    context.auth.requestUser
  );

  return result;
};
