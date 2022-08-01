import { QueuesEnum } from "@services/enums/queue.enum";
import { UserLockIdentityQueueType } from "@services/types/queue";
import { CustomContext } from "utils/types";

export async function lockUserIdentityQueueHandler(
  queueContext: CustomContext,
  queue: QueuesEnum,
  context: UserLockIdentityQueueType
): Promise<{ success: boolean; extra?: unknown }> {
  const adminService = queueContext.services.AdminService;

  const result = await adminService.lockUsers(
    context.requestUser,
    context.identityId
  );

  console.log(result);

  return {
    success: result.status === "OK",
    extra: result.error,
  };
}
