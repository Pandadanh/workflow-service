import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseDto<T>> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    
    return next.handle().pipe(
      map((data) => {
        // Nếu data đã là ApiResponseDto thì không wrap lại
        if (data instanceof ApiResponseDto) {
          return data;
        }

        // Tự động tạo message dựa trên HTTP method
        let message = 'Success';
        if (method === 'POST') {
          message = 'Created successfully';
        } else if (method === 'PUT' || method === 'PATCH') {
          message = 'Updated successfully';
        } else if (method === 'DELETE') {
          message = 'Deleted successfully';
        } else if (method === 'GET') {
          message = 'Data retrieved successfully';
        }

        return ApiResponseDto.success(data, message);
      }),
    );
  }
}
