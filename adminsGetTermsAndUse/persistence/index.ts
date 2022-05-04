import { CustomContext } from "../../utils/types";

export const createTermsAndUse = async (ctx: CustomContext, touId: string) => {
  const result = await ctx.services.TermsAndUseService.findTermsAndUseById(
    ctx.auth.requestUser,
    touId
  );

  return result;
};
