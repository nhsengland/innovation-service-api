export interface ProfileSlimModel {
  id: string;
  displayName: string;
  email?: string;
}

export interface UserEmailModel {
  id?: string;
  displayName?: string;
  email: string;
}
