import { CustomContext } from "../../utils/types";

export const findInnovationTransfers = async (ctx: CustomContext) => {
  const result = await ctx.services.InnovationTransferService.findAll(
    ctx.auth.requestUser
  );

  return result;
};
