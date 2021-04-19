import { CustomContext } from "../../utils/types";

export const findAll = async (ctx: CustomContext, filter: any) => {
  const result = await ctx.services.OrganisationService.findAll(filter);
  return result;
};
