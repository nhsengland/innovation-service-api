import { TouType } from "@domain/index";
import { TermsOfUseResultCreationModel } from "@services/models/TermsOfUseResult";
import { CustomContext } from "../../utils/types";

export const updateTermsOfUse = async (
  ctx: CustomContext,
  touPayload: TermsOfUseResultCreationModel,
  touId: string
) => {
  const result = await ctx.services.TermsOfUseService.updateTermsOfUse(
    ctx.auth.requestUser,
    touPayload,
    touId
  );

  return result;
};
