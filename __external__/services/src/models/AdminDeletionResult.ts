interface AdminDeletionError {
  code: string;
  message: string;
  data?: any;
}

export interface AdminDeletionResult {
  id: string;
  status: "OK" | "ERROR";
  error?: AdminDeletionError;
}
