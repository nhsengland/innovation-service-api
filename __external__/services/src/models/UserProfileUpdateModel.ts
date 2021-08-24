export interface UserProfileUpdateModel {
  displayName: string;
  mobilePhone?: string;
  organisation?: {
    id: string;
    isShadow?: boolean;
    name?: string;
    size?: string;
  };
}
