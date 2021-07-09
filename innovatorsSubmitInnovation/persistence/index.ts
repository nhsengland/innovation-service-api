import { CustomContext } from "../../utils/types";

export const submitInnovation = async (ctx: CustomContext, id: string) => {
  const result = await ctx.services.InnovationService.submitInnovation(
    ctx.auth.requestUser,
    id
  );

  return result;
};
