import { CustomContext } from "../../utils/types";

export const createInnovationComment = async (
  ctx: CustomContext,
  innovationId: string,
  message: string,
  iseditable?: boolean,
  replyTo?: string
) => {
  const result = await ctx.services.CommentService.create(
    ctx.auth.requestUser,
    innovationId,
    message,
    iseditable,
    replyTo
  );

  return result;
};
