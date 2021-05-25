import { InnovationStatus } from "@services/index";
import { CustomContext } from "../../utils/types";

export const getInnovationList = async (
  ctx: CustomContext,
  statuses: string[]
) => {
  const result = await ctx.services.InnovationService.getInnovationListByState(
    statuses
  );
  return result;
};
