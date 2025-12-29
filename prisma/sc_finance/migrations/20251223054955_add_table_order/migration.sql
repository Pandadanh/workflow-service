-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."PaymentProvider" AS ENUM ('MOMO', 'VNPAY', 'COD');

-- CreateEnum
CREATE TYPE "public"."WithdrawalStatus" AS ENUM ('PENDING', 'OTP_SENT', 'OTP_VERIFIED', 'PROCESSING', 'SUCCESS', 'FAILED', 'TIMEOUT', 'CANCELLED', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "public"."WithdrawalMethod" AS ENUM ('MOMO', 'BANK_TRANSFER', 'VNPAY');

-- CreateEnum
CREATE TYPE "public"."RequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'RETRY', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELED', 'REFUND_REQUEST', 'REFUNDED', 'REFUND_FAILED');

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,
    "resourceId" UUID,
    "resourceType" TEXT,
    "paymentConfirmed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" UUID NOT NULL,
    "provider" "public"."PaymentProvider" NOT NULL,
    "payUrl" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderId" UUID NOT NULL,
    "providerId" UUID,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentResultMomo" (
    "id" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "message" TEXT NOT NULL,
    "orderInfo" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "partnerCode" TEXT NOT NULL,
    "payType" TEXT NOT NULL,
    "responseTime" TIMESTAMP(3) NOT NULL,
    "resultCode" INTEGER NOT NULL,
    "transId" BIGINT NOT NULL,
    "signature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" UUID NOT NULL,
    "requestId" TEXT NOT NULL,

    CONSTRAINT "PaymentResultMomo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RefundTransaction" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "transId" BIGINT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "description" TEXT,
    "resultCode" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "responseTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefundTransaction_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "public"."WalletTransaction" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "public"."RequestRole" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RefundTransaction_orderId_idx" ON "public"."RefundTransaction"("orderId");

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

-- CreateIndex
CREATE INDEX "WalletTransaction_userId_idx" ON "public"."WalletTransaction"("userId");

-- CreateIndex
CREATE INDEX "WalletTransaction_type_idx" ON "public"."WalletTransaction"("type");

-- CreateIndex
CREATE INDEX "WalletTransaction_createdAt_idx" ON "public"."WalletTransaction"("createdAt");

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
ALTER TABLE "public"."PaymentResultMomo" ADD CONSTRAINT "PaymentResultMomo_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WithdrawalOtp" ADD CONSTRAINT "WithdrawalOtp_withdrawalId_fkey" FOREIGN KEY ("withdrawalId") REFERENCES "public"."WithdrawalTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MomoWithdrawalResult" ADD CONSTRAINT "MomoWithdrawalResult_withdrawalId_fkey" FOREIGN KEY ("withdrawalId") REFERENCES "public"."WithdrawalTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RequestWithdrawal" ADD CONSTRAINT "RequestWithdrawal_withdrawalId_fkey" FOREIGN KEY ("withdrawalId") REFERENCES "public"."WithdrawalTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
