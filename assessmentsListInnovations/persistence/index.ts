import { CustomContext } from "../../utils/types";

export const getInnovationList = async (
  ctx: CustomContext,
  statuses: string[],
  skip: number,
  take: number,
  order?: { [key: string]: string }
) => {
  const result = await ctx.services.InnovationService.getInnovationListByState(
    statuses,
    skip,
    take,
    order
  );
  return result;
};
