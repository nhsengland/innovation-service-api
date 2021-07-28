export interface UserUpdateModel {
  displayName: string;
  mobilePhone?: string;
  organisation?: {
    id: string;
    name: string;
    size: string;
  };
}
