import { CustomContext } from "../../utils/types";

export const getInnovationActivitiesById = async (
    ctx: CustomContext,
    innovationId: string,
    take: number,
    skip: number,
    activityTypes: string,
    order?: { [key: string]: string }
) => {
    const innovation = await ctx.services.InnovationService.findInnovation(
        ctx.auth.requestUser,
        innovationId,
        null
      );

    const result = await ctx.services.ActivityLogService.getInnovationActivitiesById(
        ctx.auth.requestUser,
        innovation,
        take,
        skip,
        activityTypes,
        order
    );

    return result;
};
