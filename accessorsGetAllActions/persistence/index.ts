import { CustomContext } from "../../utils/types";

export const findAllActions = async (
  ctx: CustomContext,
  accessorId: string,
  openActions: boolean,
  skip: number,
  take: number,
  order?: { [key: string]: "ASC" | "DESC" }
) => {
  const result = await ctx.services.InnovationActionService.findAllByAccessor(
    accessorId,
    ctx.auth.userOrganisations,
    openActions,
    skip,
    take,
    order
  );

  return result;
};
