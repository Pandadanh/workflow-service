import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient as CommonPrismaClient } from 'generated/prisma/sc_common/client';
import { PrismaClient as FinancePrismaClient } from 'generated/prisma/sc_finance/client';
import { PrismaClient as IdentityPrismaClient } from 'generated/prisma/sc_identity/client';
import { PrismaClient as ProcessingPrismaClient } from 'generated/prisma/sc_processing/client';
import { PrismaClient as MediaPrismaClient } from 'generated/prisma/sc_media/client';

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
