import { CustomContext } from "../../utils/types";

export const createInnovation = async (
  ctx: CustomContext,
  name: string,
  description: string,
  countryName: string,
  organisationShares: string[],
  postcode?: string
) => {
  const result = await ctx.services.InnovationService.createInnovation(
    ctx.auth.requestUser,
    {
      name,
      description,
      countryName,
      organisationShares,
      postcode,
    }
  );

  return result;
};
