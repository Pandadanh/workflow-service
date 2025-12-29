-- CreateEnum
CREATE TYPE "public"."TokenType" AS ENUM ('EMAIL_OTP', 'EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateTable
CREATE TABLE "public"."OtpToken" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "public"."TokenType" NOT NULL DEFAULT 'EMAIL_OTP',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID,
    "transactionId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "public"."TokenType" NOT NULL DEFAULT 'EMAIL_VERIFICATION',
    "userId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OtpToken_transactionId_key" ON "public"."OtpToken"("transactionId");

-- CreateIndex
CREATE INDEX "OtpToken_email_idx" ON "public"."OtpToken"("email");

-- CreateIndex
CREATE INDEX "OtpToken_token_idx" ON "public"."OtpToken"("token");

-- CreateIndex
CREATE INDEX "OtpToken_expiresAt_idx" ON "public"."OtpToken"("expiresAt");

-- CreateIndex
CREATE INDEX "OtpToken_transactionId_idx" ON "public"."OtpToken"("transactionId");

-- CreateIndex
CREATE INDEX "VerificationToken_email_idx" ON "public"."VerificationToken"("email");

-- CreateIndex
CREATE INDEX "VerificationToken_token_idx" ON "public"."VerificationToken"("token");
