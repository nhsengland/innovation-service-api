import { CustomContext } from "../../utils/types";

export const findAllInnovationSectionsMetadata = async (
  ctx: CustomContext,
  innovationId: string
) => {
  const result = await ctx.services.InnovationSectionService.findAllInnovationSectionsMetadata(
    ctx.auth.requestUser,
    innovationId
  );

  return result;
};
