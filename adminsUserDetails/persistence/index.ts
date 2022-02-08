import { UserType } from "@domain/index";
import { CustomContext } from "../../utils/types";

export const getUser = async (
  ctx: CustomContext,
  userId: string,
  model: "MINIMAL" | "FULL"
) => {
  const result = await ctx.services.AdminService.getUserDetails(userId, model);
  return result;
};
