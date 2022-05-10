import { CustomContext } from "../../utils/types";

export const acceptTermsOfUse = async (
  context: CustomContext,
  touId: string
) => {
  const result = await context.services.TermsOfUseService.acceptTermsOfUse(
    context.auth.requestUser,
    touId
  );

  return result;
};
