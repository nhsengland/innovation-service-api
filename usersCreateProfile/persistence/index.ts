import { CustomContext } from "../../utils/types";

export const getProfile = async (
  ctx: CustomContext,
  surveyId: string,
  externalId: string
) => {
  return await ctx.services.UserService.createProfile(surveyId, externalId);
};
