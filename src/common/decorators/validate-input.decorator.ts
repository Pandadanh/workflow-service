import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { ErrorHandlerService } from '../services/error-handler.service';

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'phone' | 'uuid';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export const ValidateInput = createParamDecorator(
  (rules: ValidationRules, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const errorHandler = new ErrorHandlerService();
    
    const body = request.body;
    const query = request.query;
    const params = request.params;
    
    // Combine all input sources
    const input = { ...params, ...query, ...body };
    
    // Validate input
    const validation = errorHandler.validateInput(input, rules);
    
    if (!validation.isValid) {
      throw new BadRequestException({
        status: 'error',
        message: 'Validation failed',
        data: null,
        errors: validation.errors,
        timestamp: new Date().toISOString(),
      });
    }
    
    return input;
  },
);
