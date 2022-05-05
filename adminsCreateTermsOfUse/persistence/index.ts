import { TermsOfUseResultCreationModel } from "@services/models/TermsOfUseResult";
import { CustomContext } from "../../utils/types";

export const createTermsOfUse = async (
  ctx: CustomContext,
  touPayload: TermsOfUseResultCreationModel
) => {
  const result = await ctx.services.TermsOfUseService.createTermsOfUse(
    ctx.auth.requestUser,
    touPayload
  );

  return result;
};
