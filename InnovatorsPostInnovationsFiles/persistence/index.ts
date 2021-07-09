import { CustomContext } from "../../utils/types";

export const getUploadUrl = async (
  context: CustomContext,
  fileName: string,
  innovationId: string,
  ctx: string
) => {
  return await context.services.FileService.getUploadUrl(
    fileName,
    innovationId,
    ctx
  );
};
