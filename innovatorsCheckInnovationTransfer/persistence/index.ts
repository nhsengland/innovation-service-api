import { CustomContext } from "../../utils/types";

export const checkInnovationTransferById = async (
  ctx: CustomContext,
  transferId: string
) => {
  const result = await ctx.services.InnovationTransferService.checkOne(
    transferId
  );

  return result;
};
