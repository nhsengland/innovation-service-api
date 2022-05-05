import { TouType } from "@domain/index";
import { TermsAndUseResultCreationModel } from "@services/models/TermsAndUseResult";
import { CustomContext } from "../../utils/types";

export const updateTermsAndUSe = async (
  ctx: CustomContext,
  touPayload: TermsAndUseResultCreationModel,
  touId: string
) => {
  const result = await ctx.services.TermsAndUseService.updateTermsandUse(
    ctx.auth.requestUser,
    touPayload,
    touId
  );

  return result;
};
