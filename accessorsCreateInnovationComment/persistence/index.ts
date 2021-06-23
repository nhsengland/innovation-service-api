import { CustomContext } from "../../utils/types";

export const createInnovationComment = async (
  ctx: CustomContext,
  accessorId: string,
  innovationId: string,
  message: string,
  replyTo?: string
) => {
  const result = await ctx.services.CommentService.createByAccessor(
    accessorId,
    innovationId,
    message,
    ctx.auth.userOrganisations,
    replyTo
  );

  return result;
};
