import { Controller, Post, Get } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
// import { BadmintonBookingService } from '../../badminton-bookings/application/badminton-bookings.service';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { PrismaService } from '../../../prisma.service';

@Controller('scheduler')
export class SchedulerController {
  constructor(
    private readonly schedulerService: SchedulerService,
    private readonly prisma: PrismaService,
    // private readonly badmintonBookingService: BadmintonBookingService,
  ) {}

  // @Post('trigger-import')
  // async triggerImport(): Promise<
  //   ApiResponseDto<{
  //     imported: number;
  //     updated: number;
  //     skipped: number;
  //     errors: string[];
  //   }>
  // > {
  //   const result = await this.badmintonBookingService.importFromSheet(false);
  //   return ApiResponseDto.success(
  //     result,
  //     'Manual import triggered successfully',
  //   );
  // }

  // @Post('trigger-full-import')
  // async triggerFullImport(): Promise<
  //   ApiResponseDto<{
  //     imported: number;
  //     updated: number;
  //     skipped: number;
  //     errors: string[];
  //   }>
  // > {
  //   const result = await this.badmintonBookingService.importFromSheet(true);
  //   return ApiResponseDto.success(
  //     result,
  //     'Manual full import triggered successfully',
  //   );
  // }

  @Get('status')
  async getStatus(): Promise<
    ApiResponseDto<{
      message: string;
      schedules: {
        every30Minutes: string;
        dailyAt6AM: string;
        everyHour: string;
      };
    }>
  > {
    return ApiResponseDto.success(
      {
        message: 'Scheduler is running',
        schedules: {
          every30Minutes: 'Every 30 minutes - Import new data only',
          dailyAt6AM: 'Daily at 6:00 AM - Full import (force update)',
          everyHour: 'Every hour - Check for new data',
        },
      },
      'Scheduler status retrieved successfully',
    );
  }

  @Post('trigger-weekly-booking')
  async triggerManual() {
    const result = await this.prisma.processing.$queryRaw<any>`
      SELECT * FROM auto_create_weekly_bookings();
    `;

    return {
      ok: true,
      summary: result[0],
    };
  }

}
