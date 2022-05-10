export interface ProfileSlimModel {
  id: string;
  externalId: string;
  displayName: string;
  email?: string;
}

export interface UserEmailModel {
  id?: string;
  displayName?: string;
  email: string;
}
