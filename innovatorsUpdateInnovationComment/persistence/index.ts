import { CustomContext } from "../../utils/types";

export const updateInnovationComment = async (
  ctx: CustomContext,
  innovationId: string,
  message: string,
  commentId: string
) => {
  const result = await ctx.services.CommentService.update(
    ctx.auth.requestUser,
    innovationId,
    message,
    commentId
  );

  return result;
};
