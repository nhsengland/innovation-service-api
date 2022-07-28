import { QueueMessageEnum, QueuesEnum } from "@services/enums/queue.enum";
import {
  DisplayNameUpdateIdentityQueueType,
  UserLockIdentityQueueType,
  UserUnlockIdentityQueueType,
} from "@services/types/queue";
import { lockUserIdentityQueueHandler } from "./handlers";

export const QueueMessageConfig: {
  [QueueMessageEnum.LOCK_USER]: {
    queue?: QueuesEnum;
    context?: UserLockIdentityQueueType;
    handler?: (
      queue: QueuesEnum,
      context: UserLockIdentityQueueType
    ) => Promise<{ success: boolean; extra: unknown }>;
  };
  [QueueMessageEnum.UNLOCK_USER]: {
    queue?: QueuesEnum;
    context?: UserUnlockIdentityQueueType;
    handler?: (
      queue: QueuesEnum,
      context: UserUnlockIdentityQueueType
    ) => Promise<{ success: boolean; extra: unknown }>;
  };
  [QueueMessageEnum.UPDATE_DISPLAY_NAME]: {
    queue?: QueuesEnum;
    context?: DisplayNameUpdateIdentityQueueType;
    handler?: (
      queue: QueuesEnum,
      context: DisplayNameUpdateIdentityQueueType
    ) => Promise<{ success: boolean; extra: unknown }>;
  };
} = {
  LOCK_USER: {
    queue: QueuesEnum.IDENTITY_OPERATIONS,
    handler: lockUserIdentityQueueHandler,
  },
  UNLOCK_USER: {
    queue: QueuesEnum.IDENTITY_OPERATIONS,
  },
  UPDATE_DISPLAY_NAME: {
    queue: QueuesEnum.IDENTITY_OPERATIONS,
  },
};
