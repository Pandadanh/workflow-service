export class ApiResponseDto<T = any> {
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: T;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;

  constructor(
    status: 'success' | 'error' | 'warning',
    message: string,
    data?: T,
    errors?: string[],
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  ) {
    this.status = status;
    this.message = message;
    this.data = data;
    this.errors = errors;
    this.pagination = pagination;
    this.timestamp = new Date().toISOString();
  }

  // Helper methods để tạo response nhanh
  static success<T>(data: T, message: string = 'Success'): ApiResponseDto<T> {
    return new ApiResponseDto('success', message, data);
  }

  static error(message: string = 'Error', errors?: string[]): ApiResponseDto<null> {
    return new ApiResponseDto('error', message, null, errors);
  }

  static warning<T>(data: T, message: string = 'Warning'): ApiResponseDto<T> {
    return new ApiResponseDto('warning', message, data);
  }

  static successWithPagination<T>(
    data: T,
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    },
    message: string = 'Success'
  ): ApiResponseDto<T> {
    return new ApiResponseDto('success', message, data, undefined, pagination);
  }
}
