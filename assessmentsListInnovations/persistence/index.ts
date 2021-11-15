import { OrderByClauseType, SupportFilter } from "@services/types";
import { CustomContext } from "../../utils/types";

export const getInnovationList = async (
  ctx: CustomContext,
  statuses: string[],
  skip: number,
  take: number,
  order?: OrderByClauseType[],
  supportFilter?: SupportFilter
) => {
  const result = await ctx.services.InnovationService.getInnovationListByState(
    ctx.auth.requestUser,
    statuses,
    skip,
    take,
    order,
    supportFilter
  );
  return result;
};
