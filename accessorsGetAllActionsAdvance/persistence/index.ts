import { CustomContext } from "../../utils/types";

export const findAllByAccessorAdavance = async (
  ctx: CustomContext,   
  innovationstatus: string[],
  innovationsection: string[],
  name: string,
  skip: number,
  take: number,
  order?: { [key: string]: "ASC" | "DESC" }
) => {
  const result = await ctx.services.InnovationActionService.findAllByAccessorAdvanced(
    ctx.auth.requestUser,
    innovationstatus,
    innovationsection,
    name,
    skip,
    take,   
    order
  );

  return result;
};
