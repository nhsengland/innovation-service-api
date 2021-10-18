import { CustomContext } from "../../utils/types";

export const findAllByAccessorAdvanced = async (
  ctx: CustomContext,
  innovationStatus: string[],
  innovationSection: string[],
  name: string,
  skip: number,
  take: number,
  order?: { [key: string]: "ASC" | "DESC" }
) => {
  const result = await ctx.services.InnovationActionService.findAllByAccessorAdvanced(
    ctx.auth.requestUser,
    innovationStatus,
    innovationSection,
    name,
    skip,
    take,
    order
  );
  return result;
};
