import { CustomContext } from "../../utils/types";

export const getInnovationActivitiesById = async (
    ctx: CustomContext,
    innovationId: string,
    take: number,
    skip: number,
    activityTypes: string,
    order?: { [key: string]: string }
) => {
    const result = await ctx.services.ActivityLogService.getInnovationActivitiesById(
        ctx.auth.requestUser,
        innovationId,
        take,
        skip,
        activityTypes,
        order
    );

    return result;
};
