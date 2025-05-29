export interface ApiError {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  statusCode?: number;
}
