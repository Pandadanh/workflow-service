-- CreateEnum
CREATE TYPE "public"."RequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'RETRY', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."RequestWithdrawal" (
    "id" UUID NOT NULL,
    "withdrawalId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "method" "public"."WithdrawalMethod" NOT NULL DEFAULT 'MOMO',
    "recipientInfo" JSONB NOT NULL,
    "transactionId" TEXT NOT NULL,
    "status" "public"."RequestStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" TIMESTAMP(3),
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RequestWithdrawal_transactionId_key" ON "public"."RequestWithdrawal"("transactionId");

-- CreateIndex
CREATE INDEX "RequestWithdrawal_withdrawalId_idx" ON "public"."RequestWithdrawal"("withdrawalId");

-- CreateIndex
CREATE INDEX "RequestWithdrawal_userId_idx" ON "public"."RequestWithdrawal"("userId");

-- CreateIndex
CREATE INDEX "RequestWithdrawal_status_idx" ON "public"."RequestWithdrawal"("status");

-- CreateIndex
CREATE INDEX "RequestWithdrawal_scheduledAt_idx" ON "public"."RequestWithdrawal"("scheduledAt");

-- CreateIndex
CREATE INDEX "RequestWithdrawal_priority_idx" ON "public"."RequestWithdrawal"("priority");

-- CreateIndex
CREATE INDEX "RequestWithdrawal_nextRetryAt_idx" ON "public"."RequestWithdrawal"("nextRetryAt");

-- AddForeignKey
ALTER TABLE "public"."RequestWithdrawal" ADD CONSTRAINT "RequestWithdrawal_withdrawalId_fkey" FOREIGN KEY ("withdrawalId") REFERENCES "public"."WithdrawalTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RequestWithdrawal" ADD CONSTRAINT "RequestWithdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
