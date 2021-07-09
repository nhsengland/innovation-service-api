import { CustomContext } from "../../utils/types";

export const findInnovatorById = async (ctx: CustomContext, oid: string) => {
  const result = await ctx.services.InnovatorService.find(oid);
  return result;
};
