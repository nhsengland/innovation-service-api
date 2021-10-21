import { CustomContext } from "../../utils/types";

export const findAllByAccessorAdvanced = async (
  ctx: CustomContext,
  innovationStatus: string[],
  innovationSection: string[],
  name: string,
  skip: number,
  take: number,
  isNotDeleted?: boolean,
  order?: { [key: string]: "ASC" | "DESC" }
) => {
  const result = await ctx.services.InnovationActionService.findAllByAccessorAdvanced(
    ctx.auth.requestUser,
    innovationStatus,
    innovationSection,
    name,
    skip,
    take,
    isNotDeleted,
    order
  );
  return result;
};
