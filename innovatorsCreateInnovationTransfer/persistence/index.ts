import { CustomContext } from "../../utils/types";

export const createInnovationTransfer = async (
  ctx: CustomContext,
  innovationId: string,
  email: string
) => {
  const result = await ctx.services.InnovationTransferService.create(
    ctx.auth.requestUser,
    innovationId,
    email
  );

  return result;
};
