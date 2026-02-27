export interface ApiResponse<T = any> {
  status: number;
  message: string;
  timestamp: string;
  data: T;
}
