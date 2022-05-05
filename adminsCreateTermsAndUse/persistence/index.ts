import { TouType } from "@domain/index";
import { TermsAndUseResultCreationModel } from "@services/models/TermsAndUseResult";
import { CustomContext } from "../../utils/types";

export const createTermsAndUSe = async (
  ctx: CustomContext,
  touPayload: TermsAndUseResultCreationModel
) => {
  const result = await ctx.services.TermsAndUseService.createTermsandUse(
    ctx.auth.requestUser,
    touPayload
  );

  return result;
};
