import { CustomContext } from "../../utils/types";

export const updateInnovationSection = async (
  ctx: CustomContext,
  innovationId: string,
  innovatorId: string,
  section: string,
  data: any,
  isSubmission: boolean
) => {
  const result = await ctx.services.InnovationSectionService.saveSection(
    innovationId,
    innovatorId,
    section,
    data,
    isSubmission
  );

  return result;
};
