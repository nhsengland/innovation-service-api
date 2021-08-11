import { CustomContext } from "../../utils/types";

export const checkUserPendingTransfers = async (
  ctx: CustomContext,
  oid: string
) => {
  const result = await ctx.services.InnovationTransferService.checkUserPendingTransfers(
    oid
  );

  return result;
};
