import { CustomContext } from "../../utils/types";

export const findInnovationTransferById = async (
  ctx: CustomContext,
  transferId: string
) => {
  const result = await ctx.services.InnovationTransferService.findOne(
    ctx.auth.requestUser,
    transferId
  );

  return result;
};
