-- CreateEnum
CREATE TYPE "public"."WithdrawalStatus" AS ENUM ('PENDING', 'OTP_SENT', 'OTP_VERIFIED', 'PROCESSING', 'SUCCESS', 'FAILED', 'TIMEOUT', 'CANCELLED', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "public"."WithdrawalMethod" AS ENUM ('MOMO', 'BANK_TRANSFER', 'VNPAY');

-- CreateTable
CREATE TABLE "public"."UserWallet" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "balance" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "frozenBalance" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "UserWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WithdrawalTransaction" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "status" "public"."WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "method" "public"."WithdrawalMethod" NOT NULL DEFAULT 'MOMO',
    "recipientInfo" JSONB NOT NULL,
    "transactionId" TEXT NOT NULL,
    "momoRequestId" TEXT,
    "momoTransId" TEXT,
    "requestIp" TEXT,
    "userAgent" TEXT,
    "deviceId" TEXT,
    "dailyCount" INTEGER NOT NULL DEFAULT 1,
    "weeklyAmount" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "otpSentAt" TIMESTAMP(3),
    "otpVerifiedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" TIMESTAMP(3),
    "note" TEXT,
    "properties" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "WithdrawalTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WithdrawalOtp" (
    "id" UUID NOT NULL,
    "withdrawalId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "hashedToken" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawalOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MomoWithdrawalResult" (
    "id" UUID NOT NULL,
    "withdrawalId" UUID NOT NULL,
    "requestId" TEXT NOT NULL,
    "partnerCode" TEXT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "orderId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL DEFAULT 'captureWallet',
    "resultCode" INTEGER,
    "message" TEXT,
    "responseTime" TIMESTAMP(3),
    "transId" TEXT,
    "signature" TEXT,
    "rawRequest" JSONB NOT NULL,
    "rawResponse" JSONB,
    "isSuccess" BOOLEAN NOT NULL DEFAULT false,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MomoWithdrawalResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserWithdrawalLimit" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "dailyLimit" DECIMAL(20,2) NOT NULL DEFAULT 5000000,
    "weeklyLimit" DECIMAL(20,2) NOT NULL DEFAULT 20000000,
    "monthlyLimit" DECIMAL(20,2) NOT NULL DEFAULT 50000000,
    "maxTransactions" INTEGER NOT NULL DEFAULT 10,
    "minAmount" DECIMAL(20,2) NOT NULL DEFAULT 50000,
    "maxAmount" DECIMAL(20,2) NOT NULL DEFAULT 2000000,
    "todayAmount" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "todayCount" INTEGER NOT NULL DEFAULT 0,
    "weekAmount" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "monthAmount" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "lastResetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "UserWithdrawalLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WithdrawalLog" (
    "id" UUID NOT NULL,
    "withdrawalId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WithdrawalLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserWallet_userId_key" ON "public"."UserWallet"("userId");

-- CreateIndex
CREATE INDEX "UserWallet_userId_idx" ON "public"."UserWallet"("userId");

-- CreateIndex
CREATE INDEX "UserWallet_balance_idx" ON "public"."UserWallet"("balance");

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawalTransaction_transactionId_key" ON "public"."WithdrawalTransaction"("transactionId");

-- CreateIndex
CREATE INDEX "WithdrawalTransaction_userId_idx" ON "public"."WithdrawalTransaction"("userId");

-- CreateIndex
CREATE INDEX "WithdrawalTransaction_status_idx" ON "public"."WithdrawalTransaction"("status");

-- CreateIndex
CREATE INDEX "WithdrawalTransaction_transactionId_idx" ON "public"."WithdrawalTransaction"("transactionId");

-- CreateIndex
CREATE INDEX "WithdrawalTransaction_createdAt_idx" ON "public"."WithdrawalTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "WithdrawalTransaction_expiredAt_idx" ON "public"."WithdrawalTransaction"("expiredAt");

-- CreateIndex
CREATE INDEX "WithdrawalOtp_withdrawalId_idx" ON "public"."WithdrawalOtp"("withdrawalId");

-- CreateIndex
CREATE INDEX "WithdrawalOtp_userId_idx" ON "public"."WithdrawalOtp"("userId");

-- CreateIndex
CREATE INDEX "WithdrawalOtp_token_idx" ON "public"."WithdrawalOtp"("token");

-- CreateIndex
CREATE INDEX "WithdrawalOtp_expiresAt_idx" ON "public"."WithdrawalOtp"("expiresAt");

-- CreateIndex
CREATE INDEX "MomoWithdrawalResult_withdrawalId_idx" ON "public"."MomoWithdrawalResult"("withdrawalId");

-- CreateIndex
CREATE INDEX "MomoWithdrawalResult_requestId_idx" ON "public"."MomoWithdrawalResult"("requestId");

-- CreateIndex
CREATE INDEX "MomoWithdrawalResult_orderId_idx" ON "public"."MomoWithdrawalResult"("orderId");

-- CreateIndex
CREATE INDEX "MomoWithdrawalResult_resultCode_idx" ON "public"."MomoWithdrawalResult"("resultCode");

-- CreateIndex
CREATE UNIQUE INDEX "UserWithdrawalLimit_userId_key" ON "public"."UserWithdrawalLimit"("userId");

-- CreateIndex
CREATE INDEX "UserWithdrawalLimit_userId_idx" ON "public"."UserWithdrawalLimit"("userId");

-- CreateIndex
CREATE INDEX "WithdrawalLog_withdrawalId_idx" ON "public"."WithdrawalLog"("withdrawalId");

-- CreateIndex
CREATE INDEX "WithdrawalLog_userId_idx" ON "public"."WithdrawalLog"("userId");

-- CreateIndex
CREATE INDEX "WithdrawalLog_action_idx" ON "public"."WithdrawalLog"("action");

-- CreateIndex
CREATE INDEX "WithdrawalLog_createdAt_idx" ON "public"."WithdrawalLog"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."UserWallet" ADD CONSTRAINT "UserWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WithdrawalTransaction" ADD CONSTRAINT "WithdrawalTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WithdrawalTransaction" ADD CONSTRAINT "WithdrawalTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "public"."UserWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WithdrawalOtp" ADD CONSTRAINT "WithdrawalOtp_withdrawalId_fkey" FOREIGN KEY ("withdrawalId") REFERENCES "public"."WithdrawalTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WithdrawalOtp" ADD CONSTRAINT "WithdrawalOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MomoWithdrawalResult" ADD CONSTRAINT "MomoWithdrawalResult_withdrawalId_fkey" FOREIGN KEY ("withdrawalId") REFERENCES "public"."WithdrawalTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserWithdrawalLimit" ADD CONSTRAINT "UserWithdrawalLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
