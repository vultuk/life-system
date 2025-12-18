export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UserContext {
  userId: string;
  email: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function createErrorResponse(error: string): ApiResponse<never> {
  return { success: false, error };
}

export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  return { items, total, page, limit };
}
