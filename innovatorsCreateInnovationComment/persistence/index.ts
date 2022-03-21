import { CustomContext } from "../../utils/types";

export const createInnovationComment = async (
  ctx: CustomContext,
  innovationId: string,
  message: string,
  isEditable?: boolean,
  replyTo?: string
) => {
  const result = await ctx.services.CommentService.create(
    ctx.auth.requestUser,
    innovationId,
    message,
    isEditable,
    replyTo
  );

  return result;
};
