import { CustomContext } from "../../utils/types";

export const findInnovationComments = async (
  ctx: CustomContext,
  innovationId: string,
  order?: { [key: string]: string }
) => {
  const result = await ctx.services.CommentService.findAllByInnovation(
    ctx.auth.requestUser,
    innovationId,
    order
  );

  return result;
};
