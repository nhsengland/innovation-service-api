import { CustomContext } from "../../utils/types";

export const createInnovationComment = async (
  ctx: CustomContext,
  innovationId: string,
  message: string,
  replyTo?: string
) => {
  const result = await ctx.services.CommentService.create(
    ctx.auth.requestUser,
    innovationId,
    message,
    replyTo
  );

  return result;
};
