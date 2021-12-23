import { CustomContext } from "utils/types";

export const getCode = async (context: CustomContext) => {
  const code = await context.services.AuthService.send2LS(
    context.auth.requestUser.id
  );

  return code;
};
