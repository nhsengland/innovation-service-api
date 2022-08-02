import { QueuesEnum } from "@services/enums/queue.enum";
import { UserLockIdentityQueueType } from "@services/types/queue";
import { CustomContext } from "utils/types";

export async function lockUserIdentityQueueHandler(
  queueContext: CustomContext,
  queue: QueuesEnum,
  context: UserLockIdentityQueueType
): Promise<{ success: boolean; extra?: unknown }> {
  const adminService = queueContext.services.AdminService;

  // use method that only locks user on the IdP level.
  // removes redundant database lock (already occured)
  const result = await adminService.lockUsersIdP(
    context.requestUser,
    context.identityId
  );

  console.log(result);

  return {
    success: result.status === "OK",
    extra: result.error,
  };
}
