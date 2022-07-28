import { QueuesEnum } from "@services/enums/queue.enum";
import { AdminService } from "@services/services/Admin.service";
import { UserLockIdentityQueueType } from "@services/types/queue";

export async function lockUserIdentityQueueHandler(queue: QueuesEnum, context: UserLockIdentityQueueType): Promise<{success: boolean, extra: unknown}> {

  const adminService = new AdminService();

  const result = await adminService.lockUsers(context.requestUser, context.identityId);

  return {
    success: result.status === 'OK',
    extra: result.error,
  }
}