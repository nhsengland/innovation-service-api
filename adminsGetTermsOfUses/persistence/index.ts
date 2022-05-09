import { CustomContext } from "../../utils/types";

export const createTermsOfUses = async (
  ctx: CustomContext,
  take: number,
  skip: number,
  order?: { [key: string]: string }
) => {
  const result = await ctx.services.TermsOfUseService.findAllTermsOfUse(
    ctx.auth.requestUser,
    skip,
    take,
    order
  );

  return result;
};
