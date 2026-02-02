import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient as CommonPrismaClient } from '.prisma/sc_common';
import { PrismaClient as FinancePrismaClient } from '.prisma/sc_finance';
import { PrismaClient as IdentityPrismaClient } from '.prisma/sc_identity';
import { PrismaClient as ProcessingPrismaClient } from '.prisma/sc_processing';
import { PrismaClient as MediaPrismaClient } from '.prisma/sc_media';

@Injectable()
export class PrismaService implements OnModuleInit {
  
  common = new CommonPrismaClient();
  finance = new FinancePrismaClient();
  identity = new IdentityPrismaClient();
  processing = new ProcessingPrismaClient();
  media = new MediaPrismaClient();

  async onModuleInit() {
    await Promise.all([
      this.common.$connect(),
      this.finance.$connect(),
      this.identity.$connect(),
      this.processing.$connect(),
      this.media.$connect(),
    ])
  }

}
