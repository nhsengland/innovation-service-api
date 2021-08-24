interface UserUpdateError {
  code: string;
  message: string;
}

export interface UserUpdateResult {
  id: string;
  status: "OK" | "ERROR";
  error?: UserUpdateError;
}
