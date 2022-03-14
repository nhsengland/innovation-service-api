import { AccessorOrganisationRole } from "@domain/index";
import { CustomContext } from "../../utils/types";

export const updateUserRole = async (
  ctx: CustomContext,
  userId: string,
  role: AccessorOrganisationRole
) => {
  const result = await ctx.services.AdminService.updateUserRole(
    ctx.auth.requestUser,
    userId,
    role
  );
  return result;
};
