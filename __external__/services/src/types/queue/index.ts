import { QueueMessageConfig } from "@services/config/queue";
import { QueueMessageEnum } from "@services/enums/queue.enum";
import { RequestUser } from "@services/models/RequestUser";


export type QueueContextType<T extends QueueMessageEnum> = Required<typeof QueueMessageConfig[T]>['context'];

export type IdentityQueueBaseType = {
  requestUser: RequestUser;
}



export type UserLockIdentityQueueType = IdentityQueueBaseType & {
  identityId?: string;
}

export type UserUnlockIdentityQueueType = IdentityQueueBaseType & {
  identityId?: string;
}

export type DisplayNameUpdateIdentityQueueType = IdentityQueueBaseType & {
  identityId?: string;
  displayName?: string;
}
