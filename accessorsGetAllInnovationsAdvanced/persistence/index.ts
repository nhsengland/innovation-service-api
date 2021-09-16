import { CustomContext } from "../../utils/types";
export const findAllInnovationsByAccessor = async (
  ctx: CustomContext,
  name: string,
  assignedToMe: boolean,
  suggestedOnly: boolean,
  supportStatuses: string[],
  categories: string[],
  locations: string[],
  organisations: string[],
  skip: number,
  take: number,
  order?: { [key: string]: string }
) => {
  const result = await ctx.services.InnovationService.findAllAdvanced(
    ctx.auth.requestUser,
    name,
    assignedToMe,
    suggestedOnly,
    categories,
    locations,
    organisations,
    supportStatuses,
    skip,
    take,
    order
  );

  return result;
};
