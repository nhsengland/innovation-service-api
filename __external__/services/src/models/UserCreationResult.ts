interface UserCreationError {
  code: string;
  message: string;
  data?: any;
}

export interface UserCreationResult {
  id: string;
  status: "OK" | "ERROR";
  error?: UserCreationError;
}
