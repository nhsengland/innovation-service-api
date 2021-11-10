interface UserLockError {
  code: string;
  message: string;
}

export interface UserLockResult {
  id: string;
  status: "OK" | "ERROR";
  error?: UserLockError;
}
