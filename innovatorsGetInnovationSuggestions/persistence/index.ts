import { CustomContext } from "../../utils/types";

export const findAllInnovationSuggestions = async (
  ctx: CustomContext,
  innovationId: string
) => {
  const result = await ctx.services.InnovationSuggestionService.findAllByInnovation(
    ctx.auth.requestUser,
    innovationId
  );

  return result;
};
