import { User, UserType } from "@domain/index";
import { CustomContext } from "../../utils/types";

export const getUser = async (
  ctx: CustomContext,
  userId: string,
  model: "MINIMAL" | "FULL"
) => {
  /*
   IN BEFORE YOU BRING THE PITCHFORKS:
   THIS HAS THE POTENTIAL TO BE A TEMPORARY WORKAROUND.
   WHEN A USER IS CREATED USING THE ADMINSCREATEUSER FLOW, THE FE IS CALLING THIS ENDPOINT WITH
   THE EXTERNAL ID (IDENTITY PROVIDER ID), WHICH WILL YIELD 0 RESULTS FROM DB

   IF THIS ENDPOINT IS CALLED USING THE ADMINSSEARCHUSER, THE RESULTS LIST WILL USE THE DATABASE ID
   AND WILL ALWAYS WORK.

   TO WORKAROUND THIS, IF THE USER IS NOT FOUND IT WILL TRY TO LOOK FOR IT USING THE EXTERNAL ID COLUMN
  */
  let dbUser: User;
  dbUser = await ctx.services.UserService.getUser(userId);

  if (!dbUser) {
    dbUser = await ctx.services.UserService.getUserByOptions({
      where: { externalId: userId },
    });
  }

  const result = await ctx.services.AdminService.getUserDetails(
    dbUser.externalId,
    model
  );
  return result;
};
