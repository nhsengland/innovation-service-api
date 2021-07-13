interface UserCreationError {
  code: string;
  message: string;
}

export interface UserCreationResult {
  email: string;
  userId?: string;
  organisationUserId?: string;
  organisationUnitUserId?: string;
  error?: UserCreationError;
}
