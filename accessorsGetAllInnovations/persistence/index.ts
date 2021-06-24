import { CustomContext } from "../../utils/types";
export const findAllInnovationsByAccessor = async (
  ctx: CustomContext,
  accessorId: string,
  supportStatus: string,
  assignedToMe: boolean,
  skip: number,
  take: number,
  order?: { [key: string]: string }
) => {
  const result = await ctx.services.InnovationService.findAllByAccessorAndSupportStatus(
    accessorId,
    ctx.auth.userOrganisations,
    supportStatus,
    assignedToMe,
    skip,
    take,
    order
  );
  return result;
};
