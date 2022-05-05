import { CustomContext } from "../../utils/types";

export const createTermsAndUses = async (
  ctx: CustomContext,
  take: number,
  skip: number,
  order?: { [key: string]: string }
) => {
  const result = await ctx.services.TermsAndUseService.findAllTermsAndUse(
    ctx.auth.requestUser,
    skip,
    take,
    order
  );

  return result;
};
