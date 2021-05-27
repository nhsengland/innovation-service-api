import { CustomContext } from "../../utils/types";

export const getInnovationList = async (
  ctx: CustomContext,
  statuses: string[],
  skip: number,
  take: number
) => {
  const result = await ctx.services.InnovationService.getInnovationListByState(
    statuses,
    skip,
    take
  );
  return result;
};
