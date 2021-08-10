import { CustomContext } from "../../utils/types";

export const findInnovationTransfers = async (
  ctx: CustomContext,
  assignedToMe?: boolean
) => {
  const result = await ctx.services.InnovationTransferService.findAll(
    ctx.auth.requestUser,
    assignedToMe
  );

  return result;
};
