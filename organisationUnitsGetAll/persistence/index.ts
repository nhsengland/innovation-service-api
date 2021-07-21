import { CustomContext } from "../../utils/types";

export const findAll = async (ctx: CustomContext) => {
  const result = await ctx.services.OrganisationService.findAllWithOrganisationUnits();

  return result;
};
