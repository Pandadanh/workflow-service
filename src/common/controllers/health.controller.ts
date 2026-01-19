import { Controller, Get } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { HealthCheckService } from '../services/health-check.service';

@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Get()
  async getHealth() {
    return this.healthCheckService.performHealthCheck();
  }

  @Get('detailed')
  async getDetailedHealth() {
    return this.healthCheckService.getDetailedHealth();
  }
}


