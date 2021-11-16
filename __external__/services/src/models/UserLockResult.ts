interface UserLockError {
  code: string;
  message: string;
  data?: any;
}

export interface UserLockResult {
  id: string;
  status: "OK" | "ERROR";
  error?: UserLockError;
}
