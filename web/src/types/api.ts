export interface ApiResponse<T = unknown> {
  status: number;
  message: string;
  timestamp: string;
  data: T;
}
