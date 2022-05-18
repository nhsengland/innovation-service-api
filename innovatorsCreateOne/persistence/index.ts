import { Innovation, Organisation, User } from "@domain/index";
import { Survey } from "../../schemas/Survey";
import { CustomContext } from "../../utils/types";

export const createFirstTimeSignIn = async (
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

export const createFirstTimeSignInTransfer = async (
  ctx: CustomContext,
  innovator: User,
  organisation: Organisation,
  transferId: string
) => {
  const result = await ctx.services.InnovatorService.createFirstTimeSignInTransfer(
    innovator,
    organisation,
    transferId
  );

  return result;
};

export const updateB2CUser = async (ctx: CustomContext, data: any) => {
  try {
    await ctx.services.UserService.updateB2CUser({ ...data.user }, data.oid);
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

export const getUserByExternalId = async (
  ctx: CustomContext,
  externalId: string
) => {
  const user = await ctx.services.UserService.getUserByOptions({
    where: { externalId },
  });

  return user;
};
