import { CustomContext } from "../../utils/types";

export const findAllInnovationSections = async (
  ctx: CustomContext,
  innovationId: string
) => {
  const result =
    await ctx.services.InnovationSectionService.findAllInnovationSections(
      ctx.auth.requestUser,
      innovationId
    );

  return result;
};
