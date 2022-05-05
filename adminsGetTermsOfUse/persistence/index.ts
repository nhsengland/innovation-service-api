import { CustomContext } from "../../utils/types";

export const createTermsOfUse = async (ctx: CustomContext, touId: string) => {
  const result = await ctx.services.TermsOfUseService.findTermsOfUseById(
    ctx.auth.requestUser,
    touId
  );

  return result;
};
