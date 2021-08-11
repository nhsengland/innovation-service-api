import { InnovationTransferStatus } from "@domain/index";
import { CustomContext } from "../../utils/types";

export const updateInnovationTransfer = async (
  ctx: CustomContext,
  transferId: string,
  status: string
) => {
  const result = await ctx.services.InnovationTransferService.updateStatus(
    ctx.auth.requestUser,
    transferId,
    status as InnovationTransferStatus
  );

  return result;
};
