import { CustomContext } from "../../utils/types";

export const findAllInnovationSupports = async (
  ctx: CustomContext,
  innovationId: string
) => {
  const result =
    await ctx.services.InnovationSupportService.findAllByInnovation(
      ctx.auth.requestUser,
      innovationId
    );

  return result;
};
