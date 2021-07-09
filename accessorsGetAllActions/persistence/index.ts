import { CustomContext } from "../../utils/types";

export const findAllActions = async (
  ctx: CustomContext,
  openActions: boolean,
  skip: number,
  take: number,
  order?: { [key: string]: "ASC" | "DESC" }
) => {
  const result = await ctx.services.InnovationActionService.findAllByAccessor(
    ctx.auth.requestUser,
    openActions,
    skip,
    take,
    order
  );

  return result;
};
