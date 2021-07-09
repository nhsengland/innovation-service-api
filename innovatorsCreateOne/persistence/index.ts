import { Innovation, Organisation, User } from "@domain/index";
import { Survey } from "../../schemas/Survey";
import { CustomContext } from "../../utils/types";

export const createInnovator = async (
  ctx: CustomContext,
  innovator: User,
  innovation: Innovation,
  organisation: Organisation
) => {
  const result = await ctx.services.InnovatorService.createFirstTimeSignIn(
    innovator,
    innovation,
    organisation
  );

  return result;
};

export const updateUserDisplayName = async (ctx: CustomContext, data: any) => {
  try {
    await ctx.services.UserService.updateUserDisplayName(
      { ...data.user },
      data.oid
    );
  } catch (error) {
    throw error;
  }
};

export const getSurvey = async (id: string) => {
  try {
    return await Survey.findById(id);
  } catch (error) {
    throw error;
  }
};
