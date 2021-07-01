import { CustomContext } from "../../utils/types";
export const findAllInnovationsByInnovator = async (ctx: CustomContext) => {
  const result = await ctx.services.InnovationService.findAllByInnovator(
    ctx.auth.requestUser
  );
  return result;
};
