import { CustomContext } from "../../utils/types";
export const findAllInnovationsByAccessor = async (
  ctx: CustomContext,
  accessorId: string,
  filter: any
) => {
  const result = await ctx.services.InnovationService.findAllByAccessor(
    accessorId,
    filter
  );
  return result;
};
