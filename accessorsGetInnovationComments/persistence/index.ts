import { CustomContext } from "../../utils/types";

export const findInnovationComments = async (
  ctx: CustomContext,
  innovationId: string,
  innovatorId: string,
  order?: { [key: string]: string }
) => {
  const result = await ctx.services.CommentService.findAllByInnovation(
    innovatorId,
    innovationId,
    ctx.auth.userOrganisations,
    order
  );

  return result;
};
