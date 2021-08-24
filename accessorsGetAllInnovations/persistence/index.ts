import { InnovationSupportStatus } from "@domain/index";
import { CustomContext } from "../../utils/types";
export const findAllInnovationsByAccessor = async (
  ctx: CustomContext,
  supportStatus: string,
  assignedToMe: boolean,
  skip: number,
  take: number,
  order?: { [key: string]: string }
) => {
  const result = await ctx.services.InnovationService.findAllByAccessorAndSupportStatus(
    ctx.auth.requestUser,
    supportStatus as InnovationSupportStatus,
    assignedToMe,
    skip,
    take,
    order
  );
  return result;
};
